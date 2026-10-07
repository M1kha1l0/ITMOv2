import json
import os
import time
from typing import Any, Dict, Optional

import requests


class OllamaClient:
    """Минималистичный клиент для локального Ollama API."""

    def __init__(self, base_url: Optional[str] = None) -> None:
        # Приоритет: переданный base_url -> OLLAMA_HOST env -> default
        env_host = os.getenv("OLLAMA_HOST")
        if base_url:
            url = base_url
        elif env_host:
            # поддержка как форматов host:port, так и http(s)://host:port
            if env_host.startswith("http://") or env_host.startswith("https://"):
                url = env_host
            else:
                url = f"http://{env_host}"
        else:
            url = "http://127.0.0.1:11434"
        self.base_url = url.rstrip("/")

    def _health(self) -> bool:
        try:
            r = requests.get(f"{self.base_url}/api/tags", timeout=5)
            r.raise_for_status()
            return True
        except Exception:
            return False

    def ensure_model(self, model: str, timeout_seconds: int = 600, wait: bool = True) -> None:
        # Проверяем наличие модели. Если нет — тянем.
        tags = requests.get(f"{self.base_url}/api/tags", timeout=20)
        tags.raise_for_status()
        have = False
        for m in tags.json().get("models", []) or []:
            if m.get("name") == model:
                have = True
                break
        if not have:
            # pull может быть долгим; оставим простой цикл ожидания
            resp = requests.post(f"{self.base_url}/api/pull", json={"name": model}, timeout=20)
            resp.raise_for_status()
            if wait:
                # stream прогресса: опрашиваем пока не появится среди тегов
                start = time.time()
                # Ограничение общего времени ожидания, по умолчанию 10 минут
                while time.time() - start < max(60, int(timeout_seconds)):
                    time.sleep(3)
                    tags = requests.get(f"{self.base_url}/api/tags", timeout=20)
                    if any((m.get("name") == model) for m in tags.json().get("models", []) or []):
                        break
                else:
                    raise RuntimeError(
                        f"Не удалось подготовить модель '{model}' за отведённое время ({timeout_seconds}s)."
                    )

    def chat(
        self,
        model: str,
        system: str,
        user: str,
        stream: bool = False,
        options: Optional[Dict[str, Any]] = None,
        output_format: Optional[str] = None,
        timeout_seconds: int = 300,
    ) -> str:
        # Используем /api/chat для совместимости с чат-моделями
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "stream": stream,
        }
        if options:
            payload["options"] = options
        if output_format:
            # Ollama поддерживает top-level поле "format": "json" или json_schema
            payload["format"] = output_format

        # Явно отключаем keep-alive для некоторых прокси/сетей, чтобы избежать подвисания
        headers = {"Connection": "close"}
        r = requests.post(
            f"{self.base_url}/api/chat",
            json=payload,
            timeout=max(5, int(timeout_seconds)),
            headers=headers,
        )
        r.raise_for_status()
        data = r.json()

        if stream:
            # в этом приложении stream=False, но оставляем на будущее
            chunks = []
            for line in r.iter_lines():
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    chunks.append(obj.get("message", {}).get("content", ""))
                except Exception:
                    continue
            return "".join(chunks)

        # non-stream: ожидаем финальный message
        if not isinstance(data, dict):
            raise RuntimeError("Некорректный формат ответа от Ollama API")
        message = data.get("message") or {}
        content = message.get("content", "")
        return content or ""
