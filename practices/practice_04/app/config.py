from typing import Dict, Any

# Registry of supported regions with coordinates and display name
REGIONS: Dict[str, Dict[str, Any]] = {
    "spb": {
        "name": "Санкт-Петербург",
        "lat": 59.9386,
        "lon": 30.3141,
        "tz": "Europe/Moscow",
    },
    # Example additional regions for future expansion
    "moscow": {
        "name": "Москва",
        "lat": 55.7558,
        "lon": 37.6176,
        "tz": "Europe/Moscow",
    },
}

# Crop-specific guidance injected into prompts. This allows easy extension.
CROPS: Dict[str, Dict[str, Any]] = {
    "tomato": {
        "ru_name": "томаты",
        "guidelines_ru": (
            "Ты — агроном-консультант по томатам. Учитывай оптимальные температуры почвы и воздуха,"
            " отсутствие сильных заморозков, достаточную освещенность, умеренную облачность/осадки и ветер."
        ),
    },
    # Placeholder for future crops
    "potato": {
        "ru_name": "картофель",
        "guidelines_ru": (
            "Ты — агроном-консультант по картофелю. Учитывай температуру почвы (>7–8°C), риск заморозков,"
            " переувлажнение/засуху и сильный ветер при высадке."
        ),
    },
}

def ensure_region_key(key: str) -> str:
    if key not in REGIONS:
        raise ValueError(f"Неизвестный регион: {key}. Доступные: {', '.join(sorted(REGIONS))}")
    return key

def ensure_crop_key(key: str) -> str:
    if key not in CROPS:
        raise ValueError(f"Неизвестная культура: {key}. Доступные: {', '.join(sorted(CROPS))}")
    return key
