# Tomato Planting Favorability — Практика 5 (SDD brownfield с git-spec)

Агрономическое приложение для оценки благоприятности посадки культур (томаты, картофель, огурцы) по архивным погодным факторам реанализа **Open-Meteo ERA5** и локальной LLM (**Ollama**, `qwen3.5:4b`).

Проект расширен в парадигме **Spec-Driven Development (SDD)**: поверх проверенного CLI-приложения спроектированы и согласованы спецификации HTTP API и веб-интерфейса, реализован бэкенд на FastAPI и легковесный фронтенд, а окружение агента укомплектовано специализированными skills, hook-плагином и MCP-сервером.

---

## 1. Архитектура проекта

```
practices/practice_05/
├── main.py                       # CLI-интерфейс (argparse, self-bootstrap, rich-вывод)
├── app/
│   ├── api.py                   # FastAPI приложение: POST /query, GET /health, раздача web/
│   ├── config.py                # Реестр регионов (REGIONS) и культур (CROPS)
│   ├── weather.py               # Клиент Open-Meteo ERA5 и агрегация фактов
│   └── ollama_client.py         # HTTP-клиент к локальной Ollama
├── web/                         # Веб-интерфейс (Команда UI)
│   ├── index.html               # Разметка интерфейса и семантика формы
│   ├── styles.css               # Адаптивные стили (CSS Grid/Flexbox, Dark theme)
│   └── app.js                   # Клиентская валидация даты, вызов API, рендеринг
├── specs/                       # Спецификации и контракт (SDD)
│   ├── contract.md              # Согласованный контракт взаимодействия между UI и API
│   ├── api-endpoint.md          # Спецификация логики и эндпоинтов (Команда Logic)
│   ├── frontend.md              # Спецификация состояний и экранов (Команда UI)
│   └── git-spec/                # Документация и интеграция SDD-фреймворка git-spec
├── tests/                       # Полный набор тестов (34 теста)
│   ├── test_cli_and_weather.py  # Регрессионные тесты CLI и погодных фактов
│   ├── test_api.py              # Тесты эндпоинтов FastAPI (health, query, mock)
│   └── test_e2e_scenarios.py    # Сквозные e2e-сценарии, сверка контракта, локальный запуск
├── scripts/
│   └── check.sh                 # Runner для автопроверки тестов (вызывается хуком)
├── conftest.py                  # Конфигурация окружения pytest
├── requirements.txt             # Зависимости Python (FastAPI, uvicorn, rich, httpx и др.)
├── package.json                 # Зависимости окружения (git-spec)
├── .env.example                 # Пример переменных окружения для git-spec
├── DEFENSE.md                   # Подробные материалы к защите Практики 5
├── reflection.md                # Честная рефлексия по итогам выполнения задания
└── .opencode/                   # Окружение агента OpenCode
    ├── AGENTS.md                # Правила поведения агента в brownfield SDD
    ├── skills/                  # Каталог навыков (git-spec, specs-api, specs-frontend, testing)
    ├── plugins/                 # Plugin-hook (автозапуск check.sh после правок)
    └── mcp/                     # Локальный MCP-сервер с инструментами
```

---

## 2. SDD-фреймворк git-spec

В отличие от учебного OpenSpec, в Практике 5 применен специализированный инструмент **`git-spec`** (v1.1.7).

### Особенности интеграции:
- **Нативный вызов через Git:** Инструмент зарегистрирован в PATH и доступен как стандартная подкоманда Git:
  ```bash
  git spec --help
  ```
- **Локальное векторное хранилище (PGlite):** Индексирует код и спецификации в компактную базу PostgreSQL WASM с расширением `pgvector`.
- **Семантический поиск:** Позволяет агенту и разработчику быстро находить требования контракта:
  ```bash
  git spec query "QueryRequest"
  git spec query "weather features"
  git spec query "contract"
  ```
- **Индексация проекта:**
  ```bash
  git spec index app
  git spec index specs
  git spec index web
  ```

---

## 3. Эмуляция двух команд: Согласованный контракт

До написания кода команды зафиксировали общий контракт в [specs/contract.md](file:///home/hackerman/Documents/education/itmo/vibecoding/ITMOv2/practices/practice_05/specs/contract.md):

| Эндпоинт | Метод | Назначение | Коды ответов |
|---|---|---|---|
| `/health` | `GET` | Диагностика доступности сервиса | `200 OK` (`{"status": "ok", "ok": true}`) |
| `/query` | `POST` | Анализ даты посадки культуры | `200 OK`, `422 Unprocessable Entity`, `502 Bad Gateway` |
| `/` | `GET` | Раздача веб-интерфейса | `200 OK` (`text/html`) |
| `/static/*` | `GET` | Статические файлы фронтенда (CSS, JS) | `200 OK` |

### Схема `POST /query`:
- **Вход:** `{ "date": "dd-mm-yyyy", "region": "spb|moscow", "crop": "tomato|potato|cucumber", "model": "qwen3.5:4b", "temperature": 0.2 }`
- **Выход:** `{ "verdict": "...", "probability": 85, "explanation": "...", "facts": {...}, "date_iso": "YYYY-MM-DD" }`
- **Валидация:** 422 при неверной дате или неизвестном ключе; 502 при недоступности погодного API или Ollama.

---

## 4. Установка и запуск

### 4.1. Подготовка окружения
1. Создайте виртуальное окружение и установите зависимости:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Установите зависимости Node.js для `git-spec`:
   ```bash
   npm install
   ```
3. Настройте `.env` (скопируйте из `.env.example`):
   ```bash
   cp .env.example .env
   ```

### 4.2. Запуск локального API и веб-интерфейса
Запустите сервер uvicorn:
```bash
.venv/bin/uvicorn app.api:app --host 127.0.0.1 --port 8000 --reload
```
Откройте в браузере: **http://127.0.0.1:8000**

### 4.3. Запуск CLI (консольное приложение)
Консольное приложение полностью сохраняет обратную совместимость:
```bash
.venv/bin/python main.py 15-05-2026 --region spb --crop tomato --model qwen3.5:4b
```

---

## 5. Тестирование и верификация

Тестовый набор покрывает полные пользовательские сценарии, контрактную совместимость и реальный запуск локального веб-сервера и CLI:

```bash
# Запуск через скрипт проверки
bash scripts/check.sh

# Или напрямую через pytest:
.venv/bin/pytest -v
```

Все 34 теста выполняются изолированно без внешних сетевых задержек (с monkeypatch-моками и реальным подъёмом тестового сервера на динамическом порту).

---

## 6. Окружение агента (.opencode)

1. **`AGENTS.md`** — правила работы в парадигме Spec-Driven Development, scope проекта, TDD-цикл.
2. **Skills:**
   - `.opencode/skills/git-spec` — команды векторного анализа и семантического поиска.
   - `.opencode/skills/specs-api` — разработка FastAPI-эндпоинтов по спецификации.
   - `.opencode/skills/specs-frontend` — верстка, маскирование ввода и клиентская логика.
   - `.opencode/skills/practice05.testing` — сквозные сценарии и локальные запуски.
3. **Plugin Hook (`practice05.checks`):**
   - Автоматически запускает `scripts/check.sh` после каждой записи/редактирования файла (`write:after`, `edit:after`, `patch:after`).
4. **MCP Server (`practice05`):**
   - Инструменты: `weather.features`, `validate.input`, `api.health`, `spec.query`.
