# Интеграция и конфигурация SDD-фреймворка git-spec

В Практике 5 в качестве альтернативного SDD-фреймворка (взамен OpenSpec) используется инструмент **`git-spec`** (v1.1.7).

---

## 1. Назначение и функционал git-spec

`git-spec` — инструмент для обратного инжиниринга, индексации и управления спецификациями кодовой базы с использованием локальной векторной базы данных PGlite (WASM Postgres + pgvector) и совместимых LLM-провайдеров.

В проекте git-spec используется для:
1. **Анализа зависимостей (Dependency Graph):** `git spec parse app`
2. **Векторной семантической индексации проекта:** `git spec index app`, `git spec index specs`, `git spec index web`
3. **Семантического поиска по контрактам и коду:** `git spec query "<запрос>"`
4. **Контроля согласованности контрактов между API и Frontend до генерации кода.**

---

## 2. Настройка вызова через `git spec`

Интеграция выполнена на уровне подкоманд Git:
- Установлен пакет `git-spec` в `node_modules` и зарегистрирован бинарник в PATH:
  ```bash
  which git-spec
  # /home/hackerman/.local/bin/git-spec -> practices/practice_05/node_modules/.bin/git-spec
  ```
- Благодаря механизму Git `git <subcommand>`, при вызове `git spec ...` git автоматически вызывает исполняемый файл `git-spec` из окружения проекта.
- Проверка доступности:
  ```bash
  git spec --help
  ```

---

## 3. Конфигурация провайдеров LLM и Embeddings (.env)

Для индексации и генерации используется OpenAI-совместимый эндпоинт VseLLM курса:
```ini
LLM_PROVIDER=other
LLM_BASE_URL=https://litellm.data-light.ru/v1
OPENAI_API_KEY={env:VSELLM_API_KEY}
LLM_MODEL=openai/gpt-4o-mini

EMBEDDING_PROVIDER=other
EMBEDDING_BASE_URL=https://litellm.data-light.ru/v1
EMBEDDING_MODEL=text-embedding-3-small
```

---

## 4. Сравнение SDD-подходов: OpenSpec vs git-spec

| Характеристика | OpenSpec (семинар) | git-spec (ДЗ 5) |
|---|---|---|
| **Формат артефактов** | Иерархические markdown-файлы (`proposal.md`, `specs/`, `tasks.md`, `design.md`) | Векторный индекс в PGlite (`pgvector`) + связные Markdown-спецификации контрактов |
| **Управление контекстом** | CLI-инструкции (`openspec instructions ...`) передают правила в чат | Семантический векторный поиск `git spec query` по всей кодовой базе и спекам |
| **Хранилище индекса** | Текстовые файлы в `.openspec/` | Локальный встраиваемый Postgres (PGlite) в `pglite-data/` |
| **Поддержка двух команд** | Один сквозной workflow для одного агента | Эмуляция двух команд: UI Team (`specs/frontend.md`) и Logic Team (`specs/api-endpoint.md`) с фиксацией общего контракта `specs/contract.md` до написания кода |
| **Интеграция с Git** | Отдельная команда `openspec` | Нативный вызов через Git (`git spec ...`) |

---

## 5. Типовые команды для работы

```bash
# Проверка версии и команд
git spec --version
git spec --help

# Очистка локального векторного хранилища
git spec clean

# Индексация модулей приложения, спецификаций и фронтенда
git spec index app
git spec index specs
git spec index web

# Поиск по спецификациям и кодовой базе
git spec query "FastAPI"
git spec query "QueryRequest"
git spec query "weather features"
git spec query "contract"
```
