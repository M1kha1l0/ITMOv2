/**
 * Tomato Planting Favorability - Frontend Application
 * Interacts with POST /query and GET /health
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const form = document.getElementById("planting-form");
  const dateInput = document.getElementById("date-input");
  const dateError = document.getElementById("date-error");
  const regionSelect = document.getElementById("region-select");
  const cropSelect = document.getElementById("crop-select");
  const modelInput = document.getElementById("model-input");
  const tempInput = document.getElementById("temperature-input");
  const tempVal = document.getElementById("temp-val");
  const submitBtn = document.getElementById("submit-btn");
  const btnSpinner = submitBtn.querySelector(".btn-spinner");
  const btnText = submitBtn.querySelector(".btn-text");
  const alertBox = document.getElementById("alert-box");
  const resultCard = document.getElementById("result-card");
  const apiStatus = document.getElementById("api-status");
  const statusDot = apiStatus.querySelector(".status-dot");
  const statusText = document.getElementById("api-status-text");

  // Temperature slider display
  if (tempInput && tempVal) {
    tempInput.addEventListener("input", (e) => {
      tempVal.textContent = Number(e.target.value).toFixed(1);
    });
  }

  // Date input formatting (auto-dash dd-mm-yyyy)
  dateInput.addEventListener("input", (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 8) val = val.slice(0, 8);

    let formatted = "";
    if (val.length > 4) {
      formatted = `${val.slice(0, 2)}-${val.slice(2, 4)}-${val.slice(4)}`;
    } else if (val.length > 2) {
      formatted = `${val.slice(0, 2)}-${val.slice(2)}`;
    } else {
      formatted = val;
    }
    e.target.value = formatted;
    validateDate(formatted);
  });

  // Preset buttons
  document.querySelectorAll(".btn-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      dateInput.value = btn.dataset.date;
      validateDate(btn.dataset.date);
    });
  });

  // Validate dd-mm-yyyy format
  function validateDate(val) {
    if (!val) {
      dateError.textContent = "Укажите дату посадки";
      return false;
    }
    const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = val.match(regex);
    if (!match) {
      dateError.textContent = "Формат даты должен быть строго дд-мм-гггг (например, 15-05-2026)";
      return false;
    }
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    if (month < 1 || month > 12) {
      dateError.textContent = "Некорректный номер месяца (01-12)";
      return false;
    }
    if (day < 1 || day > 31) {
      dateError.textContent = "Некорректный день месяца (01-31)";
      return false;
    }
    dateError.textContent = "";
    return true;
  }

  // Health check on load
  async function checkHealth() {
    try {
      const res = await fetch("/health");
      if (res.ok) {
        statusDot.className = "status-dot online";
        statusText.textContent = "API онлайн";
      } else {
        throw new Error("HTTP " + res.status);
      }
    } catch (err) {
      statusDot.className = "status-dot offline";
      statusText.textContent = "API недоступен";
    }
  }
  checkHealth();

  // Show alert message
  function showAlert(msg) {
    alertBox.textContent = msg;
    alertBox.className = "alert alert-error";
    alertBox.classList.remove("hidden");
  }

  function hideAlert() {
    alertBox.classList.add("hidden");
    alertBox.textContent = "";
  }

  // Set loading state
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    if (isLoading) {
      btnSpinner.classList.remove("hidden");
      btnText.textContent = "Анализ погодных данных и LLM...";
      hideAlert();
    } else {
      btnSpinner.classList.add("hidden");
      btnText.textContent = "Получить вердикт";
    }
  }

  // Render response data
  function renderResult(data) {
    resultCard.classList.remove("hidden");

    // Verdict and probability
    const verdictEl = document.getElementById("verdict-text");
    const probEl = document.getElementById("probability-text");
    const progressFill = document.getElementById("progress-fill");
    const dateBadge = document.getElementById("date-badge");
    const explanationEl = document.getElementById("explanation-text");

    const verdict = data.verdict || "Не определено";
    verdictEl.textContent = verdict;

    if (verdict.toLowerCase().includes("неблагоприятн")) {
      verdictEl.style.color = "#ef4444";
    } else {
      verdictEl.style.color = "#10b981";
    }

    const prob = typeof data.probability === "number" ? Math.round(data.probability) : 0;
    probEl.textContent = `${prob}%`;
    progressFill.style.width = `${Math.min(100, Math.max(0, prob))}%`;

    dateBadge.textContent = `Дата: ${data.date_iso}`;
    explanationEl.textContent = data.explanation || "Объяснение модели отсутствует.";

    // Weather facts
    const facts = data.facts || {};
    const daily = facts.daily || {};

    const minT = daily.temperature_min !== null && daily.temperature_min !== undefined ? `${daily.temperature_min}°C` : "н/д";
    const maxT = daily.temperature_max !== null && daily.temperature_max !== undefined ? `${daily.temperature_max}°C` : "н/д";
    document.getElementById("fact-temp").textContent = `${minT} … ${maxT}`;

    const sun = daily.sunshine_hours !== null && daily.sunshine_hours !== undefined ? `${daily.sunshine_hours} ч.` : "н/д";
    document.getElementById("fact-sun").textContent = sun;

    const precip = daily.precipitation_sum !== null && daily.precipitation_sum !== undefined ? `${daily.precipitation_sum} мм` : "0 мм";
    document.getElementById("fact-precip").textContent = precip;

    const wind = daily.wind_speed_max !== null && daily.wind_speed_max !== undefined ? `${daily.wind_speed_max} м/с` : "н/д";
    document.getElementById("fact-wind").textContent = wind;

    // Meta
    const loc = facts.location || {};
    document.getElementById("meta-info").textContent = `Локация: ${loc.city || facts.region_key} • Источник данных: ${facts.data_source || "ERA5"}`;

    // Smooth scroll to result
    resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Form submit handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const dateVal = dateInput.value.trim();
    if (!validateDate(dateVal)) {
      dateInput.focus();
      return;
    }

    const payload = {
      date: dateVal,
      region: regionSelect.value,
      crop: cropSelect.value,
      model: modelInput.value.trim() || "qwen3.5:4b",
      temperature: parseFloat(tempInput.value) || 0.2,
    };

    setLoading(true);

    try {
      const response = await fetch("/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 422) {
          const detail = json && json.detail ? json.detail : "Некорректные параметры запроса.";
          throw new Error(`Ошибка валидации (422): ${detail}`);
        } else if (response.status === 502) {
          const detail = json && json.detail ? json.detail : "Сбой внешнего сервиса (погода или LLM).";
          throw new Error(`Ошибка шлюза (502): ${detail}`);
        } else {
          throw new Error(`Ошибка сервера (${response.status}): ${json?.detail || response.statusText}`);
        }
      }

      renderResult(json);
    } catch (err) {
      showAlert(err.message || "Произошла непредвиденная ошибка при запросе к серверу.");
    } finally {
      setLoading(false);
    }
  });
});
