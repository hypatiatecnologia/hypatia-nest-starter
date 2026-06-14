# Agent guide — <!-- TODO: nome do projeto -->

Referência para assistentes de IA — Symfony.

## Stack

- **PHP:** <!-- TODO: ex. 8.2+ -->
- **Symfony:** <!-- TODO: versão -->
- **ORM:** Doctrine
- **Tests:** PHPUnit

## Where to put code

| Concern | Location |
|---------|----------|
| Controllers | `src/Controller/` |
| Entities | `src/Entity/` |
| Repositories | `src/Repository/` |
| Services | `src/Service/` ou por feature |
| Config | `config/services.yaml` |
| Routes | attributes ou `config/routes/` |

Controllers finos; regras nos services; validação com Symfony Validator.

## Conventions

- Autowiring conforme `services.yaml` do projeto.
- Conventional Commits.

## Useful scripts

```bash
symfony server:start    # ou php -S
php bin/phpunit
composer install
```

## Onboarding

<!-- TODO: README, .env -->

## Cursor

Rules: `symfony`, `php`, `php-security` · [.cursor/PORTABILITY.md](.cursor/PORTABILITY.md)
