#!/bin/sh
# Container start: apply migrations, optionally seed (idempotent — never overwrites the coach's edits), then run the API.
set -e
cd /app/apps/api
export PATH="/app/apps/api/node_modules/.bin:/app/node_modules/.bin:$PATH"
tsx src/db/migrate.ts
if [ "$SEED_ON_START" = "true" ]; then
  tsx src/seed.ts
fi
exec tsx src/server.ts
