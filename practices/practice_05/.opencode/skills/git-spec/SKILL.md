---
name: git-spec
description: Use when managing project specifications with git-spec, parsing dependencies, indexing codebase into PGlite vector store, and running semantic queries.
---

# Skill: git-spec SDD Operations

## Назначение
Используется для управления проектными спецификациями, исследования кодовой базы через векторный поиск и поддержания актуальности PGlite индекса.

## Основные команды

### 1. Парсинг зависимостей
```bash
git spec parse app
```
Строит граф зависимостей между файлами и выводит сводку по символам, экспортам и импортам.

### 2. Индексация в векторное хранилище (PGlite)
```bash
git spec index app
git spec index specs
git spec index web
```
Разбивает файлы на семантические чанки, вычисляет embeddings через модель `text-embedding-3-small` и сохраняет в локальный PGlite.

### 3. Семантический поиск по спецификациям и коду
```bash
git spec query "<вопрос или ключевые слова>"
```
Примеры:
- `git spec query "QueryRequest schema"`
- `git spec query "weather features"`
- `git spec query "contract error codes"`

### 4. Очистка индекса
```bash
git spec clean
```

## Правило SDD
Перед реализацией новой функциональности найдите существующие контракты через `git spec query`, согласуйте изменения в `specs/contract.md`, добавьте тесты и только затем пишите код.
