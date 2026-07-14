#!/bin/sh
set -eu

echo "→ Iniciando sesión en GHCR..."
echo "$GITHUB_TOKEN" | docker login ghcr.io -u maikol0629 --password-stdin

echo "→ Descargando imágenes pre-compiladas..."
docker compose -f docker-compose.prod.yml pull

echo "→ Levantando servicios..."
docker compose -f docker-compose.prod.yml up -d

echo "→ Listo. Servicios activos:"
docker compose -f docker-compose.prod.yml ps
