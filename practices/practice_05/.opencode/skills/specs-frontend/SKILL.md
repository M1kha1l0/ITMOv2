---
name: specs-frontend
description: Use when designing, modifying, or testing the Web UI (web/index.html, web/styles.css, web/app.js). Enforces UI state machine, date masking, and contract compliance with specs/contract.md.
---

# Skill: Frontend Specifications & Development

## Назначение
Используется при доработке веб-интерфейса, клиентской валидации, отображения состояний (idle, loading, success, error) и интеграции с API.

## Принципы
1. **Чистый стек:** Без тяжелых фреймворков (Vanilla JS ES6+, семантический HTML5, CSS Grid/Flexbox).
2. **Клиентская валидация:** Форматирование ввода `dd-mm-yyyy`, проверка корректности месяца (01-12) и дня (01-31) до отправки в сеть.
3. **State Machine:**
   - `idle`: форма готова к вводу, результат скрыт.
   - `loading`: кнопка `disabled`, отображается спиннер, пользователь уведомлен об обработке.
   - `success`: отображение карточки вердикта, шкалы вероятности, цитаты объяснения и сетки фактов погоды.
   - `error`: вывод понятного сообщения в alert-баннере с кодом ошибки (422/502).

## Чеклист фронтенда
- [ ] Поле ввода даты форматирует строку на лету.
- [ ] Селекты содержат культуры (`tomato`, `potato`, `cucumber`) и регионы (`spb`, `moscow`).
- [ ] Индикатор `GET /health` в шапке отображает статус соединения.
- [ ] Ошибки сервера (422, 502) отображаются на русском языке.
- [ ] Тесты `tests/test_e2e_scenarios.py::test_contract_consistency_ui_and_api` проходят.
