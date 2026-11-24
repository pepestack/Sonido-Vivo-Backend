#!/usr/bin/env bash
set -euo pipefail

SUBIR=false
if [[ "${1:-}" == "--subir" ]]; then
  SUBIR=true
  shift
fi
FUNCION="${1:-sonido-vivo-backend}"

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZIP="$RAIZ/lambda.zip"
TEMP="$(mktemp -d)"
trap 'rm -rf "$TEMP"' EXIT

echo "1/4 Preparando carpeta temporal..."
cp "$RAIZ/lambda.js" "$RAIZ/package.json" "$RAIZ/package-lock.json" "$TEMP"
cp -r "$RAIZ/src" "$TEMP"

echo "2/4 Instalando dependencias de producción..."
(cd "$TEMP" && npm ci --omit=dev --no-audit --no-fund --loglevel=error)

echo "3/4 Creando lambda.zip..."
rm -f "$ZIP"
(cd "$TEMP" && zip -qr "$ZIP" lambda.js package.json src node_modules)
MB=$(du -m "$ZIP" | cut -f1)
echo "    lambda.zip listo (${MB} MB)"
if (( MB >= 50 )); then
  echo "    Supera 50 MB: súbelo mediante S3 en vez de directo." >&2
fi

if $SUBIR; then
  echo "4/4 Subiendo a la función '$FUNCION'..."
  aws lambda update-function-code --function-name "$FUNCION" --zip-file "fileb://$ZIP" \
    --query "{Funcion:FunctionName,Estado:LastUpdateStatus,Modificado:LastModified}" --output table
else
  echo "4/4 Listo. Súbelo en Lambda > Código > Cargar desde > archivo .zip"
fi
