import requests
from typing import Dict, Any


# Координаты Санкт-Петербурга (приблизительно центр)
SPB_LAT = 59.9386
SPB_LON = 30.3141


def _open_meteo_hourly_archive(date_iso: str) -> Dict[str, Any]:
    # Используем архив ERA5, который доступен для любой даты в прошлом
    params = {
        "latitude": SPB_LAT,
        "longitude": SPB_LON,
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
        "timezone": "Europe/Moscow",
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
    if temps:
        values["daily_temperature_max"] = max(temps)
        values["daily_temperature_min"] = min(temps)

    # сумма осадков за сутки
    precip = hourly.get("precipitation") or []
    if precip:
        values["daily_precipitation_sum"] = round(sum(v for v in precip if isinstance(v, (int, float))), 2)

    # оценка часов солнечного сияния: количество часов, где shortwave_radiation > 120 W/m^2
    sw = hourly.get("shortwave_radiation") or []
    if sw:
        values["sunshine_hours"] = sum(1 for v in sw if isinstance(v, (int, float)) and v > 120.0)

    # макс скорость ветра
    ws = hourly.get("windspeed_10m") or []
    if ws:
        values["daily_windspeed_max"] = max(ws)

    return values


def fetch_features_for_date(date_iso: str) -> Dict[str, Any]:
    """Возвращает агрегированные факты по погоде/освещенности для указанной даты ISO (YYYY-MM-DD)."""
    hourly_raw = _open_meteo_hourly_archive(date_iso)
    hourly = _summarize_hourly(hourly_raw)

    facts: Dict[str, Any] = {
        "location": {
            "city": "Санкт-Петербург",
            "lat": SPB_LAT,
            "lon": SPB_LON,
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
    }
    return facts
