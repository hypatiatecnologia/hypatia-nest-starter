---
description: Faz o scaffolding seguro e padronizado de um novo componente React/Next, seguindo boas práticas de arquitetura.
---

**Objetivo:** Criar a estrutura base para um novo componente de Front-end contendo o código de UI, arquivo de testes e documentação básica (se aplicável), aplicando as regras de arquitetura e styling do projeto.

**Quando usar:** Toda vez que precisar criar um novo componente (seja UI pura ou container) para garantir que ele siga o padrão de *Clean Architecture* do front-end desde o início.

**Não usar quando:** For adicionar apenas uma pequena função utilitária ou modificar um componente existente.

**Restrições:**
- Não sobrescreva componentes já existentes sem confirmar antes.
- Sempre crie os testes com a mesma hierarquia (lado a lado com o componente ou em `__tests__/`, respeitando o padrão do repositório).

**Done when:** Os arquivos (.tsx do componente e .test.tsx/.stories.tsx se pedirem) foram criados na pasta alvo, não apresentam erros de tipagem, os utilitários de CSS como `cn()` foram importados corretamente, e o código está pronto para ser consumido.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

**Alvo:** O diretório alvo (ex: `src/components/ui` ou `src/components/forms`) e o nome do componente a ser gerado (ex: `Button`). Informar se é um *dumb component* ou *container*.

As seguintes regras guiam a geração do código: [frontend-architecture](../rules/frontend-architecture/rule.mdc), [tailwind-css](../rules/tailwind-css/rule.mdc), [typescript-react](../rules/typescript-react/rule.mdc) e [tester](../rules/tester/rule.mdc).

---

## Passo 1 — Inspeção do Ambiente e Padrões Atuais

Antes de escrever os arquivos:
1. Identifique o uso de pacotes de estilização: verifique se existe `clsx`, `tailwind-merge` ou um utilitário de estilo (ex: `src/lib/utils.ts` contendo `cn`).
2. Confirme o *test runner* (`jest`, `vitest`) e o uso de ferramentas de documentação (`@storybook/react`).
3. Confirme o padrão de estrutura de diretório de componentes (se os componentes ficam em pastas como `Component/index.tsx` ou em arquivo único `Component.tsx`). Se o diretório alvo já possuir componentes, imite sua estrutura.

## Passo 2 — Geração do Código do Componente

Crie o arquivo principal do componente aplicando os seguintes padrões:
- **Interfaces Rígidas:** Exporte as props usando o tipo `ComponentProps<"elemento">` ou interface nativa clara.
- **Função Utilitária de Estilos:** Importe o seu utilitário de CSS (como o `cn()`) e faça o merge da propriedade `className` externa com as internas.
- **Acessibilidade:** Aplique atributos básicos de a11y (ex: aria-labels) quando for interativo.

## Passo 3 — Geração do Teste e/ou Documentação

1. Escreva o teste base do componente, focando no caminho feliz e em asserts fáceis e desacoplados da implementação (`render`, buscar por roles ou textos). 
2. Se explicitamente solicitado ou se houver Storybook no projeto, gere o arquivo `NomeComponente.stories.tsx` demonstrando os principais estados visuais (Padrão, Hover, Desabilitado).

## Passo 4 — Relatório do Scaffolding

Apresente um resumo dos arquivos criados.
```
Scaffolding finalizado para {NomeComponente}:
- Criado Componente UI ({caminho-para-o-componente.tsx})
- Criado Teste ({caminho-para-o-teste.tsx})

Avisos: {Mencionar se não encontrou a função 'cn' e fez um fallback, ou se faltam dependências}.
```
