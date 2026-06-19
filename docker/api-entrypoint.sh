#!/bin/sh
set -e

if [ ! -f .env ]; then
  cp .env.docker .env
fi

if ! grep -q '^APP_KEY=base64:' .env; then
  php artisan key:generate --force --no-interaction
fi

mkdir -p database storage/app/public
touch database/database.sqlite

php artisan migrate --force --no-interaction
php artisan storage:link --force --no-interaction 2>/dev/null || true
php artisan config:cache
php artisan route:cache

exec php artisan serve --host=0.0.0.0 --port=8000
