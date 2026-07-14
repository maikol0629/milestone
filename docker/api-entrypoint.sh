#!/bin/sh
set -eu

echo "→ Running Prisma migrations..."
cd /app/packages/api
npx prisma migrate deploy

echo "→ Starting API..."
exec node dist/packages/api/src/main.js
