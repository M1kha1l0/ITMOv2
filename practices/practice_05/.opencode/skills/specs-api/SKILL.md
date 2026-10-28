---
name: specs-api
description: Use when designing, modifying, or testing the HTTP API layer (FastAPI). Ensures contract compliance with specs/contract.md and specs/api-endpoint.md without altering CLI domain core.
---

# Skill: API Specifications & Development

## Назначение
Используется при разработке, тестировании и доработке эндпоинтов HTTP API (`/query`, `/health`, раздача статики).

## Принципы
1. **Неизменность домена:** Доменные модули (`main.py`, `app/config.py`, `app/weather.py`, `app/ollama_client.py`) остаются неизменными. API — тонкая асинхронная обёртка.
2. **Строгая валидация:** Входные параметры валидируются до обращения к внешним сервисам. Некорректный ввод возвращает статус 422.
3. **Согласованность с контрактом:** Любые изменения схемы `QueryRequest` или `QueryResponse` должны быть предварительно согласованы в `specs/contract.md`.
4. **Стабильные коды ошибок:**
   - 422: неверная дата, неизвестный регион/культура.
   - 502: ошибка внешней погоды ERA5 или сбой/таймаут модели Ollama.
   - 500: внутренние системные исключения.

## Чеклист перед коммитом изменений API
- [ ] Схема запроса поддерживает `date`, `region`, `crop`, `model`, `temperature`.
- [ ] Схема ответа включает `verdict`, `probability`, `explanation`, `facts`, `date_iso`.
- [ ] Включён CORS (`CORSMiddleware`).
- [ ] Подмонтирована раздача статики `web/` (`/static` и `/`).
- [ ] Все тесты в `tests/test_api.py` и `tests/test_e2e_scenarios.py` зеленые.
