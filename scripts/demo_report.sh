#!/usr/bin/env bash
set -euo pipefail

WEBHOOK_URL="https://n8n-itmo.cyrweb.ru/webhook/weekly-digest-trigger"

echo "Triggering Weekly Issues Digest & AI Report in n8n..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$WEBHOOK_URL" -H "Content-Type: application/json" -d '{"trigger": "manual_defense"}')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS")

if [[ "$HTTP_CODE" == "200" ]]; then
  echo "SUCCESS ($HTTP_CODE): Workflow triggered successfully!"
  echo "$BODY"
  echo "Preview is available locally in: practices/practice_07.2/weekly_report_preview.html"
else
  echo "Response ($HTTP_CODE): $BODY"
fi
