import json
import types
import pytest

from app import weather
from app.config import ensure_region_key, ensure_crop_key
from main import parse_date, build_prompt


def test_parse_date_valid():
    dt = parse_date("15-05-2026")
    assert dt.year == 2026 and dt.month == 5 and dt.day == 15


@pytest.mark.parametrize("bad", ["2026-05-15", "15/05/2026", "", "32-01-2024", "aa-bb-cccc"])
def test_parse_date_invalid(bad):
    with pytest.raises(ValueError):
        parse_date(bad)


def test_region_and_crop_validation():
    assert ensure_region_key("spb") == "spb"
    assert ensure_crop_key("tomato") == "tomato"
    with pytest.raises(ValueError):
        ensure_region_key("unknown")
    with pytest.raises(ValueError):
        ensure_crop_key("unknown")


def test_build_prompt_uses_facts_and_crop():
    facts = {"location": {"city": "TestCity"}}
    prompt = build_prompt(facts, "2026-05-15", "tomato")
    assert "TestCity" in prompt["system"]
    assert "томаты" in prompt["system"]
    assert "Факты" in prompt["user"] and "2026-05-15" in prompt["user"]


def test_summarize_hourly_handles_missing():
    # Missing arrays should produce None stats and not crash
    data = {"hourly": {}}
    out = weather._summarize_hourly(data)
    # keys exist with None
    assert out.get("temperature_2m_avg") is None
    assert out.get("cloudcover_max") is None


def test_open_meteo_params_and_fetch_features(monkeypatch):
    captured = {}

    class DummyResp:
        def __init__(self, payload):
            self._payload = payload

        def raise_for_status(self):
            return None

        def json(self):
            return self._payload

    def fake_get(url, params=None, timeout=0):
        captured["url"] = url
        captured["params"] = params
        # minimal plausible hourly structure
        return DummyResp({
            "hourly": {
                "temperature_2m": [10.0, 12.0, 8.0],
                "cloudcover": [50, 60, 40],
                "shortwave_radiation": [0, 200, 500],
                "precipitation": [0.0, 0.1, 0.0],
                "relativehumidity_2m": [70, 80, 75],
                "windspeed_10m": [3.0, 5.0, 7.0],
            }
        })

    monkeypatch.setattr(weather.requests, "get", fake_get)

    facts = weather.fetch_features_for_date("2026-05-15", region_key="spb")
    # verify params used and structure present
    assert "archive-api.open-meteo.com" in captured["url"]
    assert captured["params"]["latitude"] and captured["params"]["longitude"]
    assert facts["location"]["city"]
    assert facts["daily"]["temperature_max"] == 12.0
    assert facts["daily"]["temperature_min"] == 8.0
    assert facts["daily"]["precipitation_sum"] == 0.1
    assert facts["daily"]["wind_speed_max"] == 7.0
    # sunshine hours counted where shortwave_radiation > 120
    assert facts["daily"]["sunshine_hours"] == 2


def test_summarize_hourly_edge_values():
    # Non-numeric values should be ignored in stats
    data = {
        "hourly": {
            "temperature_2m": ["a", None, 0, -5, 15],
            "precipitation": [None, "0", 0.0],
            "shortwave_radiation": [119.9, 120.0, 120.1],
            "windspeed_10m": [],
        }
    }
    out = weather._summarize_hourly(data)
    # averages computed on numeric subset
    assert out["temperature_2m_max"] == 15
    assert out["temperature_2m_min"] == -5
    # precipitation sum uses only numerics
    assert out["daily_precipitation_sum"] == 0.0
    # sunshine > 120 only
    assert out["sunshine_hours"] == 1
