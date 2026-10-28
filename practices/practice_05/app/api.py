import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from app import config, weather, ollama_client
from main import build_prompt, _parse_model_json, parse_date


class QueryRequest(BaseModel):
    date: str = Field(..., description="Дата в формате dd-mm-yyyy")
    region: str = Field("spb", description="Ключ региона (spb, moscow)")
    crop: str = Field("tomato", description="Ключ культуры (tomato, potato, cucumber)")
    model: Optional[str] = Field("qwen3.5:4b", description="Имя модели Ollama")
    temperature: Optional[float] = Field(0.2, description="Температура генерации (0.0 - 2.0)")


class QueryResponse(BaseModel):
    verdict: Optional[str] = Field(None, description="Вердикт модели")
    probability: Optional[float] = Field(None, description="Оценка вероятности успеха (0-100)")
    explanation: Optional[str] = Field(None, description="Обоснование от модели")
    facts: Dict[str, Any] = Field(..., description="Агрегированные погодные факты")
    date_iso: str = Field(..., description="Дата в формате ISO YYYY-MM-DD")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Tomato Planting Favorability API",
        description="HTTP API для оценки благоприятности посадки культур на базе погодных фактов и LLM",
        version="1.0.0",
    )

    # Enable CORS for browser clients
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount static assets if web/ directory exists
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    web_dir = os.path.join(base_dir, "web")
    if os.path.isdir(web_dir):
        app.mount("/static", StaticFiles(directory=web_dir), name="static")

        @app.get("/", include_in_schema=False)
        def index():
            index_file = os.path.join(web_dir, "index.html")
            if os.path.exists(index_file):
                return FileResponse(index_file)
            return {"status": "ok", "message": "Frontend index.html is missing"}

    @app.get("/health", summary="Проверка состояния сервиса")
    def health():
        return {"status": "ok", "ok": True}

    @app.post("/query", response_model=QueryResponse, summary="Запрос анализа посадки")
    def query(req: QueryRequest):
        # Validate date format (dd-mm-yyyy)
        try:
            dt = parse_date(req.date)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))

        # Validate region and crop keys
        try:
            region_key = config.ensure_region_key(req.region)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
        try:
            crop_key = config.ensure_crop_key(req.crop)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))

        date_iso = dt.strftime("%Y-%m-%d")

        # Fetch aggregated weather features
        try:
            facts = weather.fetch_features_for_date(date_iso, region_key)
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"weather fetch failed: {e}")

        # Build domain prompt
        prompt = build_prompt(facts, date_iso, crop_key)
        client = ollama_client.OllamaClient()
        try:
            content = client.chat(
                model=req.model or "qwen3.5:4b",
                system=prompt["system"],
                user=prompt["user"],
                stream=False,
                options={"temperature": req.temperature if req.temperature is not None else 0.2},
                output_format="json",
                timeout_seconds=90,
            )
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"model call failed: {e}")

        # Parse model structured JSON response
        try:
            data = _parse_model_json(content)
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"model returned non-JSON: {e}")

        return QueryResponse(
            verdict=data.get("verdict"),
            probability=data.get("probability"),
            explanation=data.get("explanation"),
            facts=facts,
            date_iso=date_iso,
        )

    return app


app = create_app()
