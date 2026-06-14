---
description: Redige e otimiza microcopy de interface — CTAs, mensagens de erro/sucesso, tooltips, labels e placeholders. Foco em clareza, concisão e redução de carga cognitiva. Entrega matriz de textos, não código.
---

**Objetivo:** matriz de microcopy otimizado para os elementos de UI fornecidos; reduzir fricção textual com o menor número de palavras possível.

**Quando usar:** redigir textos de uma tela nova antes de implementar; otimizar copy existente que gera confusão; revisar mensagens de erro; preparar labels e placeholders de formulário.

**Não usar quando:** problema visual ou de layout → [`audit-ui`](./audit-ui.md); mapeamento de fluxo → [`ux-flow`](./ux-flow.md); tradução de strings i18n (usar biblioteca do projeto diretamente).

**Restrições:** entregar apenas texto — sem HTML, sem classes Tailwind, sem código; não inventar textos para elementos não fornecidos; manter tom alinhado ao produto (B2C informal vs. B2B técnico); textos em português por padrão salvo especificação contrária.

**Done when:** todos os elementos UI fornecidos cobertos na matriz; cada sugestão com justificativa de UX; nenhum texto culpa o usuário nem expõe jargão técnico.

---

## Princípios de redação

### CTAs e botões
- O texto indica exatamente o que vai acontecer após o clique.
- **Proibido:** verbos genéricos — `Enviar`, `OK`, `Confirmar`, `Clique aqui`.
- **Preferir:** verbos específicos de ação — `Salvar alterações`, `Excluir conta`, `Criar projeto`, `Enviar proposta`.
- Máximo 3 palavras; iniciar sempre com verbo no infinitivo.

### Mensagens de erro
- **Proibido:** culpar o usuário (`"Você digitou errado"`) ou expor código técnico (`"Erro 500"`, `"null pointer"`).
- Estrutura obrigatória: **o que ocorreu** + **como resolver**.
  - ✅ `"O formato do e-mail é inválido. Use o padrão nome@domínio.com"`
  - ❌ `"E-mail inválido."`

### Mensagens de sucesso e confirmação
- Confirmar o que foi concluído + indicar o próximo passo natural quando couber.
  - ✅ `"Senha alterada. Você pode fazer login agora."`
  - ❌ `"Operação realizada com sucesso."`

### Placeholders e labels
- `placeholder` não substitui `<label>` — são complementares.
- Placeholder: exemplo de valor esperado (`"ex: nome@empresa.com"`), não repetição do label.
- Label: substantivo claro e sem abreviação.

### Tooltips e textos de apoio
- Usar somente em campos não óbvios ou que envolvam dados sensíveis.
- Máximo 1 frase; responder "por que preciso disso?" ou "o que acontece se eu preencher X?".
- Tom: direto e informativo — sem tom jurídico.

### Concisão
- O usuário escaneia, não lê. Eliminar: `"Por favor,"`, `"Clique no botão abaixo"`, `"Caso queira"`, `"É importante que"`.
- Se o texto pode ser cortado pela metade sem perder sentido, cortar.

---

## Formato da matriz (obrigatório)

```markdown
### ✍️ Matriz de microcopy — [tela / componente]

| Elemento UI | Texto sugerido | Justificativa UX |
|---|---|---|
| Título / header | [texto] | [por que orienta melhor] |
| CTA principal | [texto do botão] | [foco na ação] |
| CTA secundário | [texto do botão] | [distinção clara do primário] |
| Mensagem de sucesso | [texto] | [confirmação + próximo passo] |
| Mensagem de erro | [texto] | [o que ocorreu + como resolver] |
| Label do campo X | [texto] | [clareza sem abreviação] |
| Placeholder do campo X | [texto] | [exemplo, não repetição do label] |
| Tooltip / texto de apoio | [texto] | [prevenção de erro ou dado sensível] |
| Estado vazio (empty state) | [texto + CTA] | [contexto + ação de saída] |
```

Incluir apenas os elementos presentes na interface fornecida — não preencher linhas sem referência real.

---

## Referências

- **Mapeamento de fluxo e estados:** [`ux-flow`](./ux-flow.md)
- **Auditoria completa de UI com código:** [`audit-ui`](./audit-ui.md)
- **Design review holístico:** [`ui-developer`](./ui-developer.md)
