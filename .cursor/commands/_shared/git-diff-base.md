# Git — branch base e diff vs HEAD

Usar em commands que comparam a branch atual com a base do repositório (`pr`, `revisao-pr`, `security-review`).

## Detectar branch base

```bash
BASE=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
# Se BASE vazio: tentar main, depois master; se nenhum existir, perguntar ao usuário
```

## Coletar diff

```bash
git rev-parse --abbrev-ref HEAD
git diff "${BASE:-main}"..HEAD --stat
git diff "${BASE:-main}"..HEAD
git log "${BASE:-main}"..HEAD --oneline   # quando precisar de histórico de commits
git status --short                        # trabalho não commitado
```

## Cursor

Opcional: o usuário pode anexar contexto com **`@Branch`** (“o que mudou nesta branch”) — complementa, não substitui, o `git diff` acima.

## Avisos padrão

- Se `git status` mostrar alterações não commitadas: avisar que a análise reflete só commits já feitos.
- Listar arquivos com mudanças locais não commitadas.
