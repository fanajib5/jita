#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-http://localhost:3000}"
EMAIL="smoke-$(date +%s)@test.id"
COOKIE_JAR=$(mktemp)
trap 'rm -f "$COOKIE_JAR"' EXIT

fail() { echo "FAIL: $*"; exit 1; }

echo "== health =="
curl -fsS "$BASE/" >/dev/null || fail "health check failed"

echo "== register =="
curl -fsS -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Smoke\",\"email\":\"$EMAIL\",\"password\":\"abc12345\"}" \
  -c "$COOKIE_JAR" >/dev/null || fail "register failed"

echo "== me =="
curl -fsS "$BASE/api/auth/me" -b "$COOKIE_JAR" >/dev/null || fail "me failed"

echo "== cv/generate (stub) =="
curl -fsS -X POST "$BASE/api/cv/generate" -b "$COOKIE_JAR" >/dev/null || fail "cv generate failed"

echo "== logout =="
curl -fsS -X POST "$BASE/api/auth/logout" -b "$COOKIE_JAR" >/dev/null || fail "logout failed"

echo "== me after logout =="
curl -sS -o /dev/null -w "%{http_code}" "$BASE/api/auth/me" | grep -q "^401$" || fail "expected 401 after logout"

echo "all smoke tests passed"