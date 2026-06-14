#!/usr/bin/env bash
# beforeShellExecution hook: bloqueia rm recursivo em paths críticos
# e pede confirmação para rm recursivo em qualquer outro path.
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

deny() {
  printf '{"permission":"deny","user_message":"%s","agent_message":"%s"}\n' "$1" "$2"
  exit 0
}

# Qualquer remoção dentro de .git/ é sempre negada
if printf '%s' "$command" | grep -E '(^|[;&|[:space:]])rm[[:space:]][^;&|]*\.git(/|[[:space:]]|$)' > /dev/null; then
  deny "Bloqueado: remoção em diretório .git/ detectada." "O hook block-rm impediu uma remoção dentro de .git/."
fi

# Detecta rm recursivo: -r/-R em flags curtas (qualquer ordem) ou --recursive
RM_RECURSIVE='(^|[;&|[:space:]])rm[[:space:]]+(-[A-Za-z]*[rR][A-Za-z]*[[:space:]]|--recursive([[:space:]=]|$)|(-[A-Za-z]+[[:space:]]+)*-[A-Za-z]*[rR])'
if ! printf '%s' "$command" | grep -E "$RM_RECURSIVE" > /dev/null; then
  printf '%s\n' '{"permission":"allow"}'
  exit 0
fi

# Paths críticos ancorados: raiz, home (e primeiro nível), ~, $HOME
CRITICAL_PATHS='(^|[[:space:]"'"'"'])(/|/home(/[^/[:space:]"'"'"']+)?/?|/Users(/[^/[:space:]"'"'"']+)?/?|~(/[^/[:space:]"'"'"']+)?/?|\$HOME(/[^/[:space:]"'"'"']+)?/?)(["'"'"'[:space:]]|$)'
if printf '%s' "$command" | grep -E "$CRITICAL_PATHS" > /dev/null; then
  deny "Bloqueado: rm recursivo em path crítico detectado. Requer confirmação humana." "O hook block-rm impediu uma remoção recursiva em path crítico (raiz, home, ~ ou \$HOME)."
fi

# rm recursivo em path não crítico: pedir confirmação ao usuário
printf '%s\n' '{"permission":"ask","user_message":"rm recursivo detectado — confirme a remoção.","agent_message":"O hook block-rm exigiu confirmação do usuário para remoção recursiva."}'
