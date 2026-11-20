.PHONY: install test step1 step2 step3 step6 \
        test-practice-08 build-practice-08 dev-practice-08 \
        demo-pr-create demo-pr-review-other demo-pr-review-main demo-pr-status \
        demo-issue-bug demo-issue-feature demo-issue-task demo-issue-triage demo-issue-list \
        demo-report status-n8n status-github help

# === Базовые шаги курса ===
install:
	@echo "Для практик 1–2 ничего устанавливать не нужно."

test: step1 step2 step3 step6 test-practice-08

step1:
	@$(MAKE) -s -C practices/practice_01 test

step2:
	@$(MAKE) -s -C practices/practice_02 test

step3:
	@$(MAKE) -s -C practices/practice_03 test

step6:
	@$(MAKE) -s -C practices/practice_06 test

# === Практика 08: UI сервис поверх n8n (12 баллов) ===
test-practice-08:
	@echo "=== Запуск клиентских тестов Практики 8 (Vitest) ==="
	@cd practices/practice_08 && npm test

build-practice-08:
	@echo "=== Сборка продакшн бандла Практики 8 ==="
	@cd practices/practice_08 && npm run build

dev-practice-08:
	@echo "=== Запуск React UI интерфейса Практики 8 (http://localhost:5173) ==="
	@cd practices/practice_08 && npm run dev

open-mockup:
	@echo "Макет сохранён в: practices/practice_08/mockup.html"
	@xdg-open practices/practice_08/mockup.html 2>/dev/null || open practices/practice_08/mockup.html 2>/dev/null || echo "Откройте practices/practice_08/mockup.html в браузере"

# === Практика 7.1: AI Code Review Assistant (12 баллов) ===
demo-pr-create:
	@./scripts/demo_pr.sh create

demo-pr-review-other:
	@./scripts/demo_pr.sh review-other $(PR)

demo-pr-review-main:
	@./scripts/demo_pr.sh review-main $(PR)

demo-pr-status:
	@./scripts/demo_pr.sh status $(PR)

# === Практика 7.2: GitHub Issues и еженедельный отчёт (16 баллов) ===
demo-issue-bug:
	@./scripts/demo_issues.sh bug

demo-issue-feature:
	@./scripts/demo_issues.sh feature

demo-issue-task:
	@./scripts/demo_issues.sh task

demo-issue-triage:
	@./scripts/demo_issues.sh triage

demo-issue-list:
	@./scripts/demo_issues.sh list

demo-report:
	@./scripts/demo_report.sh

open-weekly-preview:
	@echo "HTML превью отчёта: practices/practice_07.2/weekly_report_preview.html"
	@xdg-open practices/practice_07.2/weekly_report_preview.html 2>/dev/null || open practices/practice_07.2/weekly_report_preview.html 2>/dev/null || echo "Откройте practices/practice_07.2/weekly_report_preview.html в браузере"

# === Статусы и диагностика инфраструктуры ===
status-github:
	@echo "=== GitHub Репозиторий: M1kha1l0/sample-python-project ==="
	@echo "--- Pull Requests ---"
	@gh pr list --repo M1kha1l0/sample-python-project --state all --limit 5
	@echo "--- Issues ---"
	@gh issue list --repo M1kha1l0/sample-python-project --state all --limit 8

help:
	@echo "Доступные команды для подготовки и защиты:"
	@echo "  make dev-practice-08         - Запустить веб-интерфейс Практики 8"
	@echo "  make test-practice-08        - Запустить 12/12 клиентских тестов"
	@echo "  make open-mockup             - Открыть интерактивный макет с 6 состояниями"
	@echo "  make demo-pr-review-other    - Запустить ревью второй моделью (Claude Sonnet 4.5)"
	@echo "  make demo-pr-review-main     - Запустить ревью основной моделью (проверка дедупликации)"
	@echo "  make demo-pr-create          - Создать новый тестовый PR для живой защиты"
	@echo "  make demo-issue-bug          - Создать тестовый bug Issue"
	@echo "  make demo-issue-triage       - Создать тестовый невнятный Issue (needs-triage)"
	@echo "  make demo-report             - Запустить генерацию еженедельного дайджеста"
	@echo "  make open-weekly-preview     - Открыть готовый срендеренный HTML-отчёт"
	@echo "  make status-github           - Посмотреть статус PR и Issues в тестовом репозитории"
