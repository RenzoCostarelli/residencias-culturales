#!/bin/sh
set -e

echo "Aplicando migraciones..."
attempt=0
max_attempts=10
until ./node_modules/.bin/prisma migrate deploy; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "No se pudieron aplicar las migraciones después de $max_attempts intentos."
    exit 1
  fi
  echo "Intento $attempt/$max_attempts falló, reintentando en 3s..."
  sleep 3
done

echo "Migraciones aplicadas. Iniciando servidor..."
exec node dist/server.js
