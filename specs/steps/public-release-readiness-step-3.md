# Passo 3: quick start e scaffold verificáveis

## Goal

Tornar setup e `create-service` verificáveis, atômicos e acionáveis em ambiente limpo.

## Tarefas

1. Criar testes sem infraestrutura para argumentos, destino e falha parcial de `create-service`.
2. Criar testes controlados para pré-requisitos e diagnóstico de `setup-local`.
3. Ajustar os scripts somente onde os testes demonstrarem quebra do contrato.
4. Adicionar scripts npm explícitos para executar a verificação na CI.

## Paths afetados (limite absoluto)

- `scripts/create-service.sh`
- `scripts/setup-local.sh`
- `test/scripts/create-service.test.cjs`
- `test/scripts/setup-local.test.cjs`
- `package.json`

## Fora de Escopo

- Alterar a aplicação NestJS, exigir Docker nos testes padrão ou criar um gerador novo.

## Critério de Pronto

- Testes provam sucesso e falhas acionáveis sem deixar scaffold parcial tratado como sucesso.

## Dependências

- Passos 1 e 2.

## Checklist pré-handoff

- [ ] Testes usam diretórios temporários e fakes controlados.
- [ ] Nenhum Docker ou serviço externo obrigatório.
- [ ] Cinco arquivos ou menos.

## Prompt de handoff

```text
Implemente APENAS o Passo 3.
Files: @scripts/create-service.sh @scripts/setup-local.sh @test/scripts/create-service.test.cjs @test/scripts/setup-local.test.cjs @package.json
Out of scope: app NestJS, Docker real na suíte padrão e novo gerador.
Done criteria: setup e scaffold têm testes herméticos e falhas acionáveis.
---
@specs/steps/public-release-readiness-step-3.md
@specs/public-release-readiness.md
```
