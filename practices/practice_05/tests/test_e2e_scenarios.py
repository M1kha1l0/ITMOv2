import json
import socket
import subprocess
import sys
import threading
import time
import pytest
import httpx
from fastapi.testclient import TestClient
from app.api import create_app
from app import weather, ollama_client


@pytest.fixture
def dummy_weather_facts():
    return {
        "location": {"city": "Санкт-Петербург", "lat": 59.93, "lon": 30.31},
        "date": "2026-05-15",
        "daily": {
            "temperature_max": 18.5,
            "temperature_min": 8.0,
            "precipitation_sum": 0.0,
            "sunshine_hours": 9,
            "wind_speed_max": 4.2,
        },
        "hourly": {
            "temperature_2m_avg": 13.5,
            "precipitation_sum": 0.0,
        },
        "data_source": "open-meteo.com ERA5",
        "region_key": "spb",
        "timezone": "Europe/Moscow",
    }


class DummyModelSuccess:
    def chat(self, **kwargs):
        return json.dumps({
            "verdict": "Благоприятно",
            "probability": 85,
            "explanation": "Температура и освещенность оптимальны для высадки.",
        })


class DummyModelFailure:
    def chat(self, **kwargs):
        raise ConnectionError("Ollama service unreachable")


# ==============================================================================
# 1. Сквозные сценарии API
# ==============================================================================

@pytest.mark.parametrize("crop", ["tomato", "potato", "cucumber"])
@pytest.mark.parametrize("region", ["spb", "moscow"])
def test_full_scenario_api_successful_query(monkeypatch, dummy_weather_facts, crop, region):
    """Сквозной сценарий: запрос через API с валидными данными для всех культур и регионов."""
    monkeypatch.setattr(weather, "fetch_features_for_date", lambda d, r: dummy_weather_facts)
    monkeypatch.setattr(ollama_client, "OllamaClient", DummyModelSuccess)

    client = TestClient(create_app())
    response = client.post("/query", json={
        "date": "15-05-2026",
        "region": region,
        "crop": crop,
        "model": "qwen3.5:4b",
        "temperature": 0.2,
    })

    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "Благоприятно"
    assert data["probability"] == 85
    assert "оптимальны" in data["explanation"]
    assert data["date_iso"] == "2026-05-15"
    assert data["facts"]["location"]["city"] == "Санкт-Петербург"
    assert data["facts"]["daily"]["sunshine_hours"] == 9


def test_scenario_api_weather_service_down(monkeypatch):
    """Сценарий обработки ошибки: внешний API погоды недоступен (ожидается 502)."""
    def failing_weather(date_iso, region_key):
        raise RuntimeError("ERA5 service connection timeout")

    monkeypatch.setattr(weather, "fetch_features_for_date", failing_weather)
    client = TestClient(create_app())

    response = client.post("/query", json={"date": "15-05-2026", "region": "spb", "crop": "tomato"})
    assert response.status_code == 502
    assert "weather fetch failed" in response.json()["detail"]


def test_scenario_api_model_down(monkeypatch, dummy_weather_facts):
    """Сценарий обработки ошибки: локальная модель недоступна (ожидается 502)."""
    monkeypatch.setattr(weather, "fetch_features_for_date", lambda d, r: dummy_weather_facts)
    monkeypatch.setattr(ollama_client, "OllamaClient", DummyModelFailure)

    client = TestClient(create_app())
    response = client.post("/query", json={"date": "15-05-2026", "region": "spb", "crop": "tomato"})
    assert response.status_code == 502
    assert "model call failed" in response.json()["detail"]


@pytest.mark.parametrize("invalid_date", ["2026/05/15", "32-01-2024", "15-13-2024", "not-a-date", ""])
def test_scenario_api_invalid_date_formats(invalid_date):
    """Сценарий валидации: некорректные форматы дат дают 422."""
    client = TestClient(create_app())
    response = client.post("/query", json={"date": invalid_date, "region": "spb", "crop": "tomato"})
    assert response.status_code == 422


# ==============================================================================
# 2. Сценарии раздачи фронтенда и проверка контракта
# ==============================================================================

def test_frontend_static_serving():
    """Сценарий: раздача статических файлов фронтенда через FastAPI."""
    client = TestClient(create_app())

    # Проверка отдачи главной страницы
    r_index = client.get("/")
    assert r_index.status_code == 200
    assert "text/html" in r_index.headers["content-type"]
    assert "Tomato Planting Favorability" in r_index.text
    assert 'id="planting-form"' in r_index.text

    # Проверка отдачи CSS
    r_css = client.get("/static/styles.css")
    assert r_css.status_code == 200
    assert "text/css" in r_css.headers["content-type"]

    # Проверка отдачи JS
    r_js = client.get("/static/app.js")
    assert r_js.status_code == 200
    assert "javascript" in r_js.headers["content-type"]


def test_contract_consistency_ui_and_api():
    """Сценарий: сверка контракта между фронтендом (app.js) и API (QueryRequest/QueryResponse)."""
    from app.api import QueryRequest, QueryResponse

    # Читаем клиентский JS
    with open("web/app.js", "r", encoding="utf-8") as f:
        js_code = f.read()

    # Поля запроса, отправляемые из фронтенда
    for field in ["date", "region", "crop", "model", "temperature"]:
        assert field in js_code, f"Поле {field} должно присутствовать в отправке JS"
        assert field in QueryRequest.model_fields, f"Поле {field} должно быть в QueryRequest Pydantic схеме"

    # Поля ответа, обрабатываемые во фронтенде
    for field in ["verdict", "probability", "explanation", "facts", "date_iso"]:
        assert field in js_code, f"Поле {field} должно обрабатываться в JS"
        assert field in QueryResponse.model_fields, f"Поле {field} должно быть в QueryResponse Pydantic схеме"


# ==============================================================================
# 3. Сценарии локального запуска сервиса и CLI
# ==============================================================================

def find_free_port():
    """Поиск свободного TCP-порта для локального сервера."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]


def test_scenario_local_api_server_startup():
    """Сквозной сценарий проверки реального локального запуска uvicorn-сервера."""
    import uvicorn

    port = find_free_port()
    config = uvicorn.Config(app=create_app(), host="127.0.0.1", port=port, log_level="error")
    server = uvicorn.Server(config)

    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()

    base_url = f"http://127.0.0.1:{port}"
    try:
        # Ожидание готовности сервера (до 5 секунд)
        ready = False
        for _ in range(50):
            try:
                r = httpx.get(f"{base_url}/health", timeout=1.0)
                if r.status_code == 200:
                    ready = True
                    break
            except Exception:
                time.sleep(0.1)

        assert ready, "Локальный uvicorn сервер не запустился в отведённое время"

        # Запрос к /health
        res_health = httpx.get(f"{base_url}/health")
        assert res_health.status_code == 200
        assert res_health.json()["status"] == "ok"

        # Запрос к главной странице фронтенда
        res_ui = httpx.get(f"{base_url}/")
        assert res_ui.status_code == 200
        assert "Tomato Planting Favorability" in res_ui.text

    finally:
        server.should_exit = True
        thread.join(timeout=3.0)


def test_scenario_cli_local_launch():
    """Сквозной сценарий проверки локального вызова CLI приложения main.py."""
    py_bin = sys.executable

    # Проверка запуска с --help
    res_help = subprocess.run(
        [py_bin, "main.py", "--help"],
        capture_output=True,
        text=True,
    )
    assert res_help.returncode == 0
    assert "date" in res_help.stdout
    assert "--region" in res_help.stdout
    assert "--crop" in res_help.stdout

    # Проверка запуска с некорректной датой (должен завершиться с кодом 2)
    res_bad = subprocess.run(
        [py_bin, "main.py", "2026-05-15"],
        capture_output=True,
        text=True,
    )
    assert res_bad.returncode == 2
