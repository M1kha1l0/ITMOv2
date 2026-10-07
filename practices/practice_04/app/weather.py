import requests
from typing import Dict, Any, Tuple
from .config import REGIONS


def _coords_for_region(region_key: str) -> Tuple[float, float, str, str]:
    """Returns (lat, lon, tz, human_name) for region key from REGIONS."""
    region = REGIONS.get(region_key)
    if not region:
        raise ValueError(f"Неизвестный регион: {region_key}")
    return float(region["lat"]), float(region["lon"]), str(region["tz"]), str(region["name"])


def _open_meteo_hourly_archive(date_iso: str, region_key: str) -> Dict[str, Any]:
    # Используем архив ERA5, который доступен для любой даты в прошлом
    lat, lon, tz, _ = _coords_for_region(region_key)
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": date_iso,
        "end_date": date_iso,
        "hourly": ",".join([
            "temperature_2m",
            "cloudcover",
            "shortwave_radiation",
            "precipitation",
            "relativehumidity_2m",
            "windspeed_10m",
        ]),
        "timezone": tz,
    }
    r = requests.get("https://archive-api.open-meteo.com/v1/era5", params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def _summarize_hourly(data: Dict[str, Any]) -> Dict[str, Any]:
    hourly = data.get("hourly", {})
    values: Dict[str, Any] = {}

    def stats(arr):
        arr_nums = [v for v in arr if isinstance(v, (int, float))]
        if not arr_nums:
            return None, None, None
        avg = round(sum(arr_nums) / len(arr_nums), 2)
        return avg, max(arr_nums), min(arr_nums)

    # Основные ряды
    keys_map = {
        "temperature_2m": "temperature_2m",
        "cloudcover": "cloudcover",
        "shortwave_radiation": "shortwave_radiation",
        "precipitation": "precipitation",
        "relativehumidity_2m": "relativehumidity_2m",
        "windspeed_10m": "windspeed_10m",
    }

    for key_out, key_in in keys_map.items():
        arr = hourly.get(key_in)
        if isinstance(arr, list) and arr:
            avg, max_v, min_v = stats(arr)
            values[f"{key_out}_avg"] = avg
            values[f"{key_out}_max"] = max_v
            values[f"{key_out}_min"] = min_v
        else:
            values[f"{key_out}_avg"] = None
            values[f"{key_out}_max"] = None
            values[f"{key_out}_min"] = None

    # Производные дневные метрики
    temps = hourly.get("temperature_2m") or []
    temps_num = [v for v in temps if isinstance(v, (int, float))]
    if temps_num:
        values["daily_temperature_max"] = max(temps_num)
        values["daily_temperature_min"] = min(temps_num)
    else:
        values["daily_temperature_max"] = None
        values["daily_temperature_min"] = None

    # сумма осадков за сутки
    precip = hourly.get("precipitation") or []
    precip_num = [v for v in precip if isinstance(v, (int, float))]
    if precip_num:
        values["daily_precipitation_sum"] = round(sum(precip_num), 2)
    else:
        values["daily_precipitation_sum"] = 0.0

    # оценка часов солнечного сияния: количество часов, где shortwave_radiation > 120 W/m^2
    sw = hourly.get("shortwave_radiation") or []
    if sw:
        values["sunshine_hours"] = sum(1 for v in sw if isinstance(v, (int, float)) and v > 120.0)
    else:
        values["sunshine_hours"] = 0

    # макс скорость ветра
    ws = hourly.get("windspeed_10m") or []
    ws_num = [v for v in ws if isinstance(v, (int, float))]
    if ws_num:
        values["daily_windspeed_max"] = max(ws_num)
    else:
        values["daily_windspeed_max"] = None

    return values


def fetch_features_for_date(date_iso: str, region_key: str = "spb") -> Dict[str, Any]:
    """Возвращает агрегированные факты по погоде/освещенности для указанной даты ISO (YYYY-MM-DD).
    Параметр region_key определяет место получения фактов.
    """
    lat, lon, tz, name = _coords_for_region(region_key)
    hourly_raw = _open_meteo_hourly_archive(date_iso, region_key)
    hourly = _summarize_hourly(hourly_raw)

    facts: Dict[str, Any] = {
        "location": {
            "city": name,
            "lat": lat,
            "lon": lon,
        },
        "date": date_iso,
        "daily": {
            "temperature_max": hourly.get("daily_temperature_max"),
            "temperature_min": hourly.get("daily_temperature_min"),
            "precipitation_sum": hourly.get("daily_precipitation_sum"),
            "sunshine_hours": hourly.get("sunshine_hours"),
            "wind_speed_max": hourly.get("daily_windspeed_max"),
        },
        "hourly": hourly,
        "data_source": "open-meteo.com ERA5",
        "region_key": region_key,
        "timezone": tz,
    }
    return facts
