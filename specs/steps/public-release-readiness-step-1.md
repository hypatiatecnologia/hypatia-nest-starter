# Passo 1: alinhar o contrato técnico

## Goal

Alinhar versões, comandos e distribuição declarados e impedir publicação npm acidental.

## Tarefas

1. Corrigir o README para NestJS 11 e Node.js 22.
2. Adicionar `"private": true` ao `package.json`.
3. Verificar coerência entre `.nvmrc`, Dockerfile e CI.
4. Manter comandos de instalação e build equivalentes entre documentação e automação.

## Paths afetados (limite absoluto)

- `README.md`
- `package.json`
- `.nvmrc`
- `Dockerfile`
- `.github/workflows/ci.yml`

## Fora de Escopo

- Atualizar dependências, publicar pacote, mudar a arquitetura ou alterar visibilidade.

## Critério de Pronto

- Os cinco contratos concordam em Node.js 22, NestJS 11 e distribuição somente pelo repositório.

## Checklist pré-handoff

- [ ] `package.json` contém `"private": true`.
- [ ] Nenhuma mudança de lockfile ou dependência.
- [ ] CI continua usando `.nvmrc`.

## Prompt de handoff

```text
Implemente APENAS o Passo 1.
Files: @README.md @package.json @.nvmrc @Dockerfile @.github/workflows/ci.yml
Out of scope: dependências, arquitetura, npm publish e visibilidade.
Done criteria: contratos coerentes em Node 22/NestJS 11 e pacote protegido contra publicação.
---
@specs/steps/public-release-readiness-step-1.md
@specs/public-release-readiness.md
```
