#!/bin/bash
# Google Places API で語学学校情報を同期

echo "🔄 学校情報を同期中..."

curl -X POST http://localhost:3000/api/admin/sync-schools \
  -H "x-admin-secret: abro-sync-2026" \
  -H "Content-Type: application/json" \
  | jq .

echo ""
echo "✅ 同期完了"
