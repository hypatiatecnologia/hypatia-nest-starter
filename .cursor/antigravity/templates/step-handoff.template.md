# Passo N: [título curto]

## Goal

[Uma frase — o que este passo entrega]

## Tarefas

1. [Tarefa concreta com path]
2. […]

## Fora de Escopo

- [Item explicitamente excluído]
- […]

## Critério de Pronto

- [Comportamento ou teste verificável]

## Checklist pré-handoff

- [ ] ≤ 5 arquivos **alterados ou criados**? (leitura não conta)
- [ ] Paths reais no prompt (sem placeholders)?
- [ ] Critério de pronto claro e testável?
- [ ] Open questions da spec mestre não bloqueiam este passo?

---

## Prompt Cursor

```text
@model-routing @token-budget

Implemente APENAS o passo abaixo — não expanda escopo.
Arquivos: @[pasta ou arquivos do módulo]
Fora de escopo: [copiar da seção Fora de Escopo]
Critério de pronto: [copiar da seção Critério de Pronto]
Modelo: Composer 2.5 Standard

---

@specs/steps/<feature>-passo-N.md
```
