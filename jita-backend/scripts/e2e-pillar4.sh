#!/usr/bin/env bash
set -e
BASE="${BASE:-http://localhost:3000}"

echo "Pillar 4 e2e — see docs/plans/2026-09-04-04-pillar-4-admin-notifications.md"
echo "Manual steps:"
echo "  1. Set SMTP_HOST=... (or leave empty for skipped)"
echo "  2. Set WEBHOOK_URL=https://webhook.site/<uuid> (or empty for skipped)"
echo "  3. Restart server"
echo "  4. Upload doc as student, approve as admin"
echo "  5. Check: student sees in-app notification in /api/notifications/mine"
echo "  6. Check webhook.site for HMAC-signed POST"
