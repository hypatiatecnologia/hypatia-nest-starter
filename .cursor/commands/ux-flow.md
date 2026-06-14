---
description: Mapeia jornada do usuário, arquitetura da informação, estados e edge cases para uma funcionalidade ANTES do desenvolvimento. Entrega blueprint para o engenheiro de UI — sem gerar código.
---

**Objetivo:** blueprint de comportamento de UI (jornada + IA + estados + edge cases) como documento de referência para desenvolvimento; **proibido gerar HTML/CSS/React neste command**.

**Quando usar:** antes de iniciar uma nova tela ou fluxo; quando o escopo da UI ainda não está definido; ao revisar se um fluxo existente está correto antes de refactor.

**Não usar quando:** a tela já está mapeada e é hora de implementar → [`create-component`](./create-component.md); ADR ou spec de arquitetura backend → [`spec`](./spec.md); bug em fluxo existente → [`debug`](./debug.md).

**Restrições:** não gerar código (HTML, CSS, React, Tailwind); mapear apenas o comportamento visível ao usuário; basear edge cases na realidade do domínio — não em hipóteses exóticas; listar só dados que o usuário **precisa** para tomar uma decisão (eliminar ruído).

**Done when:** jornada principal definida passo a passo; componentes lógicos listados; estados fundamentais mapeados; edge cases prioritários cobertos com mitigação de UI.

---

## Diretrizes de mapeamento

### Jornada e happy path
- Definir ponto de entrada (de onde o usuário chega), ações principais em sequência e ponto de saída ou sucesso.
- Cada passo deve ser uma ação do usuário ou uma resposta do sistema — sem misturar os dois na mesma linha.

### Arquitetura da informação
- Listar apenas os dados que o usuário precisa ver para tomar a decisão desta tela; o que não influencia a decisão é ruído — omitir.
- Ordenar por relevância decrescente: o dado mais importante no topo/destaque visual.

### Mapeamento de estados
Cobrir os 4 estados fundamentais para toda interface com dados assíncronos:

| Estado | O que mapear |
|---|---|
| **Loading** | Qual granularidade de skeleton/spinner; o que bloqueia interação |
| **Empty** | Mensagem de contexto + ação primária sugerida |
| **Error** | Mensagem segura para o usuário + ação de recuperação (retry, voltar, suporte) |
| **Success** | Feedback positivo + próximo passo natural no fluxo |

### Edge cases
Focar nos cenários que **mudam o comportamento da UI**, não em erros técnicos internos:
- Conectividade: o que acontece se a ação falha no meio?
- Volume: lista com 0 itens, 1 item, >100 itens — layout quebra?
- Permissão: usuário sem acesso a parte dos dados — esconder, desabilitar ou redirecionar?
- Concorrência: outro usuário editou o mesmo recurso antes do submit?

---

## Formato do blueprint (obrigatório)

```markdown
### 🗺️ Jornada do usuário — [funcionalidade]

**Entrada:** [de onde o usuário chega]

1. [Ação do usuário]
2. [Resposta do sistema]
3. ...

**Saída/Sucesso:** [estado final esperado]

---

### 🧱 Componentes lógicos necessários

- [Nome descritivo do componente] — [responsabilidade de uma frase]
- ...

> Não são nomes de arquivo React; são blocos de UI com responsabilidade clara.

---

### 🚦 Estados e edge cases

| Estado | Comportamento esperado |
|---|---|
| Loading | ... |
| Empty | ... |
| Error | ... |
| Success | ... |

**Edge cases:**
- [Cenário] → [como a UI mitiga]
- ...
```

---

## Referências

- **Próximo passo após blueprint:** [`create-component`](./create-component.md)
- **Spec de arquitetura (ADR, backend):** [`spec`](./spec.md)
- **Consistência visual do que for implementado:** [`review-design-consistency`](./review-design-consistency.md)
