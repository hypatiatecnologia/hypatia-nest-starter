#!/usr/bin/env bash
# afterFileEdit hook: formata arquivos TS/TSX editados pelo agente.
# Evento informativo (fire-and-forget) — nunca bloqueia; sempre sai com 0.
input="$(cat)"

command -v python3 >/dev/null 2>&1 || exit 0

file_path="$(printf '%s' "$input" | python3 -c 'import json, sys
try:
    print(json.load(sys.stdin).get("file_path", ""))
except Exception:
    print("")
' 2>/dev/null)"

case "$file_path" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

[ -f "$file_path" ] || exit 0

# Mesmo formatador do lint-staged; silencioso se o repo não tiver prettier local.
npx --no-install prettier --write "$file_path" >/dev/null 2>&1 || true
exit 0
