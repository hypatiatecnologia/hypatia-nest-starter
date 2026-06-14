# Agent guide — <!-- TODO: nome do projeto -->

Referência para assistentes de IA — Python.

## Stack

- **Python:** <!-- TODO: ex. 3.12 -->
- **Framework:** <!-- TODO: FastAPI | Django | Flask -->
- **Package manager:** <!-- TODO: uv | poetry | pip + venv -->
- **ORM / DB:** <!-- TODO: SQLAlchemy, Django ORM -->
- **Tests:** pytest

## Where to put code

| Concern | Location |
|---------|----------|
| App entry | <!-- TODO: `app/main.py`, `manage.py` --> |
| Routes / views | <!-- TODO: `app/api/`, `app/views/` --> |
| Domain / services | <!-- TODO: `app/services/`, `domain/` --> |
| Models | <!-- TODO: `app/models/` --> |
| Settings | <!-- TODO: `app/settings.py`, `.env` --> |

Validação na borda (Pydantic, Django forms/serializers). Sem lógica pesada nas views.

## Conventions

- Type hints onde o projeto já usa.
- Secrets só via env; nunca commitar `.env`.
- Conventional Commits (ou padrão do time).

## Useful scripts

```bash
# TODO: ajustar
# uv run pytest
# poetry run pytest
# python -m pytest
```

## Onboarding

<!-- TODO: README, venv/uv/poetry setup -->

## Cursor

Rules: `python`, `python-security` · [.cursor/PORTABILITY.md](.cursor/PORTABILITY.md)
