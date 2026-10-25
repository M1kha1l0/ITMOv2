import json
import pytest

try:
    from app.api import create_app
    from fastapi.testclient import TestClient
except Exception:  # pragma: no cover - allows running without fastapi installed yet
    create_app = None
    TestClient = None


pytestmark = pytest.mark.skipif(create_app is None or TestClient is None, reason="fastapi not available")


def test_health_ok():
    client = TestClient(create_app())
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_query_success_monkeypatched(monkeypatch):
    # Avoid real network/model calls
    from app import weather
    from app import ollama_client

    def fake_fetch(date_iso, region_key="spb"):
        return {
            "location": {"city": "TestCity", "lat": 1.0, "lon": 2.0},
            "date": date_iso,
            "daily": {
                "temperature_max": 12.0,
                "temperature_min": 3.0,
                "precipitation_sum": 0.0,
                "sunshine_hours": 5,
                "wind_speed_max": 6.0,
            },
            "hourly": {},
            "data_source": "test",
            "region_key": region_key,
            "timezone": "Europe/Moscow",
        }

    class DummyClient:
        def chat(self, **kwargs):
            return json.dumps({
                "verdict": "Благоприятно",
                "probability": 70,
                "explanation": "Тестовое объяснение",
            })

    monkeypatch.setattr(weather, "fetch_features_for_date", fake_fetch)
    monkeypatch.setattr(ollama_client, "OllamaClient", DummyClient)

    client = TestClient(create_app())
    r = client.post("/query", json={
        "date": "15-05-2026",
        "region": "spb",
        "crop": "tomato",
        "model": "qwen3.5:4b",
        "temperature": 0.1,
    })
    assert r.status_code == 200
    data = r.json()
    assert data["verdict"]
    assert data["facts"]["location"]["city"] == "TestCity"
    assert data["date_iso"] == "2026-05-15"


def test_query_invalid_date():
    client = TestClient(create_app())
    r = client.post("/query", json={"date": "2026/05/15"})
    assert r.status_code == 422


def test_query_unknown_region():
    client = TestClient(create_app())
    r = client.post("/query", json={"date": "15-05-2026", "region": "unknown"})
    assert r.status_code == 422


def test_query_model_non_json(monkeypatch):
    from app import ollama_client
    from app import weather

    def fake_fetch(date_iso, region_key="spb"):
        return {"location": {"city": "X"}, "date": date_iso, "daily": {}, "hourly": {}}

    class DummyClient:
        def chat(self, **kwargs):
            return "not a json"

    monkeypatch.setattr(weather, "fetch_features_for_date", fake_fetch)
    monkeypatch.setattr(ollama_client, "OllamaClient", DummyClient)

    client = TestClient(create_app())
    r = client.post("/query", json={"date": "15-05-2026"})
    assert r.status_code == 502
