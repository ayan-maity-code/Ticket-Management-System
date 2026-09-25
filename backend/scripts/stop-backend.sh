#!/usr/bin/env bash
# Stops Spring Boot backends that may hold the H2 file lock.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB_FILE="$ROOT/data/support_ticket.mv.db"

echo "Stopping Support Ticket backend processes..."
pkill -f 'com.akshat.supportticket.backend.BackendApplication' 2>/dev/null || true
pkill -f 'support-ticket-backend' 2>/dev/null || true
pkill -f 'BackendApplication' 2>/dev/null || true

if command -v fuser >/dev/null 2>&1 && [[ -f "$DB_FILE" ]]; then
  fuser -k "$DB_FILE" 2>/dev/null || true
fi

sleep 1

if [[ -f "$DB_FILE" ]]; then
  rm -f "$ROOT/data/support_ticket.lock.db" "$ROOT/data/support_ticket.mv.db.lock" 2>/dev/null || true
fi

echo "Done. Start again with: cd \"$ROOT\" && ./gradlew bootRun"
