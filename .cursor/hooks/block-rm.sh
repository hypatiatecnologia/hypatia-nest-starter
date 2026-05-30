#!/usr/bin/env bash
# beforeShellExecution hook: bloqueia rm -rf em paths críticos
input="$(cat)"

command="$input"
if command -v python3 >/dev/null 2>&1; then
  parsed_command="$(printf '%s' "$input" | python3 -c 'import json, sys
try:
    payload = json.load(sys.stdin)
except Exception:
    print("")
else:
    print(payload.get("command", ""))
' 2>/dev/null)"
  if [ -n "$parsed_command" ]; then
    command="$parsed_command"
  fi
fi

# Paths críticos que nunca devem ser removidos pelo agente
CRITICAL_PATHS='/|/home/|/Users/|~|\.git/|\$HOME'

# Detecta rm -rf (ou variantes) em paths críticos
if printf '%s' "$command" | grep -E "rm[[:space:]]+-[rRf]+.*($CRITICAL_PATHS)" > /dev/null; then
  printf '%s\n' '{"permission":"deny","user_message":"Bloqueado: rm -rf em path crítico detectado. Requer confirmação humana.","agent_message":"O hook block-rm impediu uma remoção recursiva em path crítico."}'
  exit 0
fi

# Detecta rm sem -i em arquivos versionados (proteção adicional)
if printf '%s' "$command" | grep -E 'rm[[:space:]]+.*\.git/' > /dev/null; then
  printf '%s\n' '{"permission":"deny","user_message":"Bloqueado: remoção em diretório .git/ detectada.","agent_message":"O hook block-rm impediu uma remoção dentro de .git/."}'
  exit 0
fi

printf '%s\n' '{"permission":"allow"}'
