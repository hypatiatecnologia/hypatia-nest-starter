#!/usr/bin/env bash
# beforeSubmitPrompt: bloqueia envio se o prompt contiver padrões de secret conhecidos.
set -euo pipefail

input="$(cat)"

if ! command -v python3 >/dev/null 2>&1; then
  printf '%s\n' '{"continue":true}'
  exit 0
fi

printf '%s' "$input" | python3 -c '
import base64
import json
import re
import sys

payload = json.load(sys.stdin)
prompt = payload.get("prompt", "")

patterns = [
    (r"(AKIA|ASIA|AGPA|AIDA|AROA)[0-9A-Z]{16}", "chave AWS"),
    (r"sk-(proj-|live-|test-|ant-)?[A-Za-z0-9_-]{20,}", "token OpenAI/Anthropic"),
    (r"(ghp|gho|ghs|ghu|ghr)_[A-Za-z0-9]{36,}", "token GitHub"),
    (r"github_pat_[A-Za-z0-9_]{60,}", "PAT GitHub"),
    (r"AIza[A-Za-z0-9_-]{35}", "chave Google API"),
    (r"xox[abprs]-[A-Za-z0-9-]{10,}", "token Slack"),
    (r"-----BEGIN [A-Z ]*PRIVATE KEY-----", "chave privada PEM"),
]

JWT_PATTERN = r"eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"


def is_public_anon_jwt(token):
    """Anon keys do Supabase são JWTs públicos por design (role=anon)."""
    try:
        payload_b64 = token.split(".")[1]
        payload_b64 += "=" * (-len(payload_b64) % 4)
        claims = json.loads(base64.urlsafe_b64decode(payload_b64))
    except Exception:
        return False
    return claims.get("role") == "anon"


def block(label):
    print(json.dumps({
        "continue": False,
        "user_message": f"Prompt bloqueado: possível {label} detectado. Remova o segredo antes de enviar.",
    }, ensure_ascii=False))
    sys.exit(0)


for pattern, label in patterns:
    if re.search(pattern, prompt):
        block(label)

for match in re.finditer(JWT_PATTERN, prompt):
    if not is_public_anon_jwt(match.group(0)):
        block("JWT")

print(json.dumps({"continue": True}))
'
