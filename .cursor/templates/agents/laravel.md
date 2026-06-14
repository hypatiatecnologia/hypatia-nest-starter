# Agent guide — <!-- TODO: nome do projeto -->

Referência para assistentes de IA — Laravel.

## Stack

- **PHP:** <!-- TODO: ex. 8.3+ -->
- **Framework:** Laravel <!-- TODO: versão -->
- **DB:** Eloquent
- **Tests:** PHPUnit / Pest

## Where to put code

| Concern | Location |
|---------|----------|
| HTTP | `app/Http/Controllers/` |
| Form requests | `app/Http/Requests/` |
| Policies / auth | `app/Policies/` |
| Domain logic | `app/Services/` ou Actions |
| Models | `app/Models/` |
| Routes | `routes/web.php`, `routes/api.php` |
| Migrations | `database/migrations/` |

Controllers magros; validação em FormRequest; autorização em Policy.

## Conventions

- Eloquent scopes para queries reutilizáveis.
- Conventional Commits.

## Useful scripts

```bash
php artisan serve
php artisan test
composer install
```

## Onboarding

<!-- TODO: README, .env.example -->

## Cursor

Rules: `laravel`, `php`, `php-security` · [.cursor/PORTABILITY.md](.cursor/PORTABILITY.md)
