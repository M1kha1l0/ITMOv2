#!/usr/bin/env bash
set -euo pipefail

REPO="M1kha1l0/sample-python-project"
TYPE="${1:-help}"

case "$TYPE" in
  bug)
    TITLE="[Bug] Critical Redis session timeout on peak load $(date +%H:%M:%S)"
    BODY="### Steps to reproduce
1. Send 500 auth requests/sec
2. Redis connection pool exhausts
3. Server returns 504 Gateway Timeout and drops active sessions.
Expected: Session pool expands or queues gracefully.
Actual: KeyError: 'session_id' in session_store.py:84"
    gh issue create --repo "$REPO" --title "$TITLE" --body "$BODY"
    ;;

  feature)
    TITLE="[Feature] Add OpenTelemetry tracing support $(date +%H:%M:%S)"
    BODY="### Feature Request
Please integrate OpenTelemetry SDK for distributed tracing across database queries, HTTP outgoing requests, and Celery background workers."
    gh issue create --repo "$REPO" --title "$TITLE" --body "$BODY"
    ;;

  task)
    TITLE="[Task] Upgrade Docker base image to Python 3.12-slim $(date +%H:%M:%S)"
    BODY="### Task Description
Update Dockerfile base image to python:3.12-slim, rebuild dependencies and verify vulnerability scan with Trivy."
    gh issue create --repo "$REPO" --title "$TITLE" --body "$BODY"
    ;;

  triage|unknown)
    TITLE="Сайт виснет или не грузит $(date +%H:%M:%S)"
    BODY="Что-то периодически тормозит, почините пожалуйста скорее."
    gh issue create --repo "$REPO" --title "$TITLE" --body "$BODY"
    ;;

  list)
    gh issue list --repo "$REPO" --state all --limit 10
    ;;

  *)
    echo "Usage: $0 {bug|feature|task|triage|list}"
    exit 1
    ;;
esac
