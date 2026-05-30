---
description: Explica código com referências path:linha; somente leitura, sem refactors.
---

**Objetivo:** explicar propósito, contratos e erros do alvo.

**Quando usar:** entender módulo/símbolo antes de editar.

**Não usar quando:** corrigir bug → [`debug`](./debug.md); ensino didático → [`ensinar`](./ensinar.md).

**Done when:** seis seções do Passo 2 preenchidas; incertezas marcadas.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

**Alvo:** path + símbolo opcional ou intervalo de linhas — definir no mesmo turno.

**Proibido** modificar, criar ou deletar qualquer arquivo.

---

**1. Ler o contexto ao redor antes de explicar**

Antes de explicar o alvo, inspecionar:

- O módulo/pacote onde o alvo está inserido (arquivos vizinhos no mesmo diretório).
- Os chamadores diretos do símbolo — buscar por importações e usos no repositório.
- Os contratos externos assumidos: interfaces que o alvo implementa, tipos que recebe/retorna, tabelas ou coleções que acessa, tópicos/filas que publica ou consome.

Não explicar em isolamento; o contexto de uso frequentemente é mais revelador que o código interno.

---

**2. Estrutura de saída obrigatória**

Produzir sempre nesta ordem:

1. **Propósito** — o que este código faz no contexto do sistema (1–3 frases, sem jargão técnico desnecessário).
2. **Entradas e saídas** — parâmetros com tipos e semântica; valor de retorno ou efeito colateral principal.
3. **Contratos e invariantes** — o que o código assume que é verdade ao ser chamado, e o que garante ao retornar.
4. **Dependências externas** — APIs, banco de dados, cache, filas, outros módulos — com `path:linha` ou referência concreta quando possível.
5. **Caminhos de erro** — quais condições geram exceção, erro ou retorno vazio; o que o chamador deve tratar.
6. **Incertezas** — qualquer afirmação não confirmada por evidência no código deve ser marcada explicitamente: "não encontrei chamador", "tipo muito amplo para inferir", "comportamento depende de configuração de runtime não visível aqui".

---

**3. Referências concretas**

Para cada afirmação não trivial usar `path:intervalo` ou citar bloco do repositório. Não afirmar comportamento sem apontar de onde foi extraído.

---

**4. Limites do comando**

- Não propor refactors, otimizações ou melhorias — nem pequenas. Se identificar problemas, registrá-los em uma seção **"Observações"** ao final, claramente separada da explicação.
- Não executar código nem testes.
- Se o alvo for muito grande para explicar com precisão em uma única resposta, dividir por subsistema e avisar o usuário.
