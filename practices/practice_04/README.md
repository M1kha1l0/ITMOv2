Tomato Planting Favorability (SPB) — CLI

Описание
CLI-приложение на Python, которое по переданной дате (dd-mm-yyyy) собирает погодные факты для Санкт-Петербурга (Open-Meteo) и запрашивает локальную модель через Ollama (qwen3.5:4b). Модель возвращает JSON с полями verdict, probability, explanation. Приложение выводит ровно ответ модели и показывает статусы обработки запроса.

Установка
1. Создайте виртуальное окружение и установите зависимости:
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt

2. Установите и запустите Ollama: https://ollama.com
   Убедитесь, что доступен localhost:11434.

Запуск
python main.py predict 15-05-2026 --model qwen3.5:4b

Параметры
- date (аргумент): дата в формате dd-mm-yyyy
- --model: имя модели Ollama (по умолчанию qwen3.5:4b)
- --temperature: температура выборов модели (0.0–2.0, по умолчанию 0.2)

Примечания
- Приложение выводит только ответ модели; никакой дополнительной интерпретации не добавляется.
- Источник фактов: open-meteo.com
