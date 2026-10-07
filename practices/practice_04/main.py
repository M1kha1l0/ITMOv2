import argparse
import json
import os
import sys
import subprocess
from datetime import datetime
from typing import Dict, Any


def ensure_runtime() -> None:
    """Гарантирует запуск в локальном виртуальном окружении с зависимостями.
    Если зависимости отсутствуют — создаёт .venv, ставит requirements.txt и перезапускает скрипт внутри .venv.
    """
    # Проверяем, доступны ли ключевые пакеты
    def _try_imports() -> bool:
        try:
            import rich  # noqa: F401
            import requests  # noqa: F401
            import dateutil  # noqa: F401
            return True
        except Exception:
            return False

    if _try_imports():
        return

    project_root = os.path.dirname(os.path.abspath(__file__))
    venv_dir = os.path.join(project_root, ".venv")
    py_bin = os.path.join(venv_dir, "bin", "python")
    pip_bin = os.path.join(venv_dir, "bin", "pip")

    # Создаём venv при необходимости
    if not os.path.isdir(venv_dir):
        print("Создаю виртуальное окружение .venv...")
        subprocess.check_call([sys.executable, "-m", "venv", venv_dir])

    # Ставим зависимости
    req = os.path.join(project_root, "requirements.txt")
    if os.path.isfile(req):
        print("Устанавливаю зависимости из requirements.txt...")
        subprocess.check_call([py_bin, "-m", "pip", "install", "-r", req])
    else:
        # fallback на точечную установку
        subprocess.check_call([py_bin, "-m", "pip", "install", "rich==13.7.1", "requests==2.32.3", "python-dateutil==2.9.0.post0"])

    # Перезапускаем текущий скрипт в .venv
    print("Перезапускаю в виртуальном окружении...")
    os.execv(py_bin, [py_bin, os.path.abspath(__file__), *sys.argv[1:]])


# Bootstrap окружения до импортов сторонних пакетов, но не во время pytest
if not os.environ.get("PYTEST_CURRENT_TEST"):
    ensure_runtime()

from rich.console import Console  # noqa: E402
from rich.panel import Panel  # noqa: E402
from rich.table import Table  # noqa: E402
from rich.progress import Progress, SpinnerColumn, TextColumn  # noqa: E402
from dateutil import tz  # noqa: E402

from app.weather import fetch_features_for_date  # noqa: E402
from app.config import ensure_region_key, ensure_crop_key, CROPS  # noqa: E402
from app.ollama_client import OllamaClient  # noqa: E402


console = Console()


def parse_date(date_str: str) -> datetime:
    try:
        return datetime.strptime(date_str, "%d-%m-%Y").replace(tzinfo=tz.gettz("Europe/Moscow"))
    except ValueError as e:
        raise ValueError("Ожидаемый формат даты: dd-mm-yyyy, пример: 15-05-2026") from e


def build_prompt(facts: Dict[str, Any], date_iso: str, crop_key: str) -> Dict[str, Any]:
    crop = CROPS[crop_key]
    region_name = facts.get("location", {}).get("city", "Регион")
    system = (
        f"Ты — агроном-консультант по {crop['ru_name']} для региона {region_name}. \n"
        "На основе предоставленных погодных фактов реши, благоприятна ли посадка в указанную дату.\n"
        "Отвечай строго в JSON без лишнего текста с полями: \n"
        "verdict — строка (например: 'Благоприятно' или 'Неблагоприятно'), \n"
        "probability — число от 0 до 100 (процент успеха), \n"
        "explanation — краткое объяснение с опорой на факты (коротко, 2-4 предложения).\n"
        + crop["guidelines_ru"]
    )
    user = (
        "Дата: "
        + date_iso
        + f"\nРегион: {region_name}\nКультура: {crop['ru_name']}\nФакты (JSON):\n"
        + json.dumps(facts, ensure_ascii=False)
    )
    return {"system": system, "user": user}


def print_result_from_model(content: str) -> None:
    # Пытаемся разобрать JSON и вывести структурированно; если не получилось — печатаем как есть
    try:
        data = json.loads(content)
        verdict = data.get("verdict")
        probability = data.get("probability")
        explanation = data.get("explanation")

        table = Table(title="Ответ модели", show_lines=False, expand=True)
        table.add_column("Поле", style="bold cyan", no_wrap=True)
        table.add_column("Значение")
        table.add_row("verdict", str(verdict))
        table.add_row("probability", str(probability))
        table.add_row("explanation", str(explanation))
        console.print(table)
    except Exception:
        console.print(Panel.fit(content, title="Ответ модели (как есть)", border_style="green"))


def main():
    parser = argparse.ArgumentParser(
        description="CLI для прогноза благоприятности посадки помидор (СПб) по дате"
    )
    parser.add_argument("date", help="Дата в формате dd-mm-yyyy")
    parser.add_argument("--model", default="qwen3.5:4b", help="Имя модели Ollama")
    parser.add_argument("--temperature", type=float, default=0.2, help="Температура выборов модели (0.0-2.0)")
    parser.add_argument("--region", default="spb", help="Ключ региона (например: spb, moscow)")
    parser.add_argument("--crop", default="tomato", help="Ключ культуры (например: tomato, potato)")

    args = parser.parse_args()

    try:
        dt = parse_date(args.date)
    except ValueError as e:
        console.print(Panel.fit(str(e), title="Неверный формат даты", border_style="red"))
        raise SystemExit(2)

    date_iso = dt.strftime("%Y-%m-%d")
    try:
        region_key = ensure_region_key(args.region)
        crop_key = ensure_crop_key(args.crop)
    except ValueError as e:
        console.print(Panel.fit(str(e), title="Неверный параметр", border_style="red"))
        raise SystemExit(2)
    client = OllamaClient()

    try:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
            console=console,
        ) as progress:
            t_model = progress.add_task("Проверяю и подготавливаю модель Ollama...", start=True)
            client.ensure_model(args.model)
            progress.update(t_model, visible=False, completed=1)

            t_weather = progress.add_task("Получаю погодные данные и факты...", start=True)
            facts = fetch_features_for_date(date_iso, region_key)
            progress.update(t_weather, visible=False, completed=1)

            t_prompt = progress.add_task("Формирую запрос к модели...", start=True)
            prompt = build_prompt(facts, date_iso, crop_key)
            progress.update(t_prompt, visible=False, completed=1)

            t_infer = progress.add_task("Запрашиваю модель и жду ответ...", start=True)
            options = {"temperature": args.temperature}
            content = client.chat(
                model=args.model,
                system=prompt["system"],
                user=prompt["user"],
                stream=False,
                options=options,
                output_format="json",
            )
            progress.update(t_infer, visible=False, completed=1)
    except Exception as e:
        console.print(Panel.fit(str(e), title="Ошибка обработки", border_style="red"))
        raise SystemExit(1)

    # Важно: выводим ровно ответ модели (без придумывания своего вердикта)
    print_result_from_model(content)


if __name__ == "__main__":
    main()
