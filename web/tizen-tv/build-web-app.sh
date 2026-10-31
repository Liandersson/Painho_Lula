#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
WEB_ROOT="$(cd -- "$HERE/.." && pwd)"
APP_ROOT="$WEB_ROOT/app"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 22 ou superior não foi encontrado. Instale Node.js e pnpm antes de compilar." >&2
  exit 1
fi
NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
if (( NODE_MAJOR < 22 )); then
  echo "Este web app exige Node.js 22 ou superior (encontrado: $(node --version))." >&2
  exit 1
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm não foi encontrado. Ative-o com: corepack enable && corepack prepare pnpm@11.25.0 --activate" >&2
  exit 1
fi

cd "$WEB_ROOT"
pnpm install --frozen-lockfile
pnpm --filter @bitchord/app exec tsc -p .
pnpm --filter @bitchord/app exec vite build --mode tizen

rm -rf "$HERE/full-app"
mkdir -p "$HERE/full-app"
cp -a "$APP_ROOT/dist/." "$HERE/full-app/"
echo "Web app completa copiada para: $HERE/full-app"
echo "Agora importe web/tizen-tv no Tizen Studio e execute Run As → Tizen Web Application."
