---
name: practice05.testing
description: Use when authoring, running, or debugging end-to-end scenario tests, local server startup verification, and CLI regressions.
---

# Skill: Practice 05 Testing & Local Verification

## Назначение
Обеспечивает строгое качество кодовой базы через написание полных сценариев использования API, фронтенда и CLI, включая проверку реальных локальных запусков.

## Категории тестов

### 1. Модульные тесты CLI и погоды (`tests/test_cli_and_weather.py`)
- Валидация формата даты `parse_date`.
- Проверка справочников культур и регионов `app/config.py`.
- Агрегация почасовых метеоданных ERA5 и расчет производных метрик.
- Устойчивый парсинг structured JSON ответа модели.

### 2. Интеграционные тесты API (`tests/test_api.py`)
- Проверка доступности `GET /health`.
- Успешный `POST /query` с изоляцией сети через monkeypatch.
- Валидационные ошибки (422) для дат и регионов.
- Обработка сбоев модели (502).

### 3. Сквозные сценарии и локальные запуски (`tests/test_e2e_scenarios.py`)
- Полный цикл для всех культур (`tomato`, `potato`, `cucumber`) и регионов (`spb`, `moscow`).
- Сценарии деградации: сбой погодного сервиса (502), недоступность Ollama (502).
- Раздача статических файлов фронтенда (`GET /`, `GET /static/styles.css`, `GET /static/app.js`).
- Автоматическая сверка согласованности контракта между JS-кодом и Pydantic-схемами.
- Реальный локальный запуск сервера uvicorn на свободном порту и проверка HTTP-ответов.
- Реальный локальный запуск CLI `main.py` через системный вызов subprocess.

## Команда проверки
```bash
scripts/check.sh
# или напрямую:
.venv/bin/pytest -v
```
Все 34+ теста обязаны быть зелёными!
