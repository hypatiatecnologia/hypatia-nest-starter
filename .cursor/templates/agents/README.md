# Templates `AGENTS.md` por stack

Modelos mínimos para a **raiz do repositório** (`AGENTS.md`). O Cursor carrega este arquivo junto com `.cursor/`.

## Uso manual

```bash
cp .cursor/templates/agents/nextjs.md ./AGENTS.md
# Edite paths, scripts e links de onboarding
```

## Uso com script

Execute na raiz do **repo fonte** do pack (onde está `scripts/sync-cursor-config.sh`):

```bash
./scripts/sync-cursor-config.sh ../outro-repo --agents nextjs --with-ignore
```

## Stacks disponíveis

| Arquivo | Quando usar |
|---------|-------------|
| [remix-fsd.md](./remix-fsd.md) | React Router v7 / Remix + FSD |
| [nextjs.md](./nextjs.md) | Next.js (App Router ou Pages) |
| [nestjs.md](./nestjs.md) | NestJS greenfield |
| [nestjs-hypatia.md](./nestjs-hypatia.md) | NestJS no ecossistema Pantheon/Hypatia |
| [express-idea.md](./express-idea.md) | Node Express + Yup (legado Idea) |
| [go.md](./go.md) | Go (cmd/internal ou layout padrão) |
| [java-spring.md](./java-spring.md) | Spring Boot (Java) |
| [kotlin-spring.md](./kotlin-spring.md) | Spring Boot + Kotlin (JVM backend) |
| [kotlin-android.md](./kotlin-android.md) | Android / Compose (e KMP no app) |
| [python.md](./python.md) | Python (FastAPI/Django genérico) |
| [laravel.md](./laravel.md) | Laravel |
| [symfony.md](./symfony.md) | Symfony |
| [react-native.md](./react-native.md) | React Native / Expo |
| [generic.md](./generic.md) | Fallback — preencher à mão |

Após copiar, substitua placeholders `<!-- TODO: ... -->` e linhas com `…`.
