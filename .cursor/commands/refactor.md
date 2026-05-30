---
description: Refactor cirúrgico com baseline de testes; uma transformação por passo. Use Plan Mode se escopo for grande.
---

**Objetivo:** melhorar estrutura sem mudar comportamento observável.

**Quando usar:** smells localizados com testes existentes.

**Não usar quando:** bug fix → [`debug`](./debug.md); feature nova → fluxo normal de dev.

**Done when:** critérios do Passo 4 todos atendidos.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

**Alvo:** (módulos/arquivos) — definir no chat. Refactor grande: **Plan Mode** (`Shift+Tab`) antes de editar.

Ativar overlays de stack no picker quando aplicável ([typescript-node](../rules/typescript-node/rule.mdc), [typescript-react](../rules/typescript-react/rule.mdc), [typescript-react-native](../rules/typescript-react-native/rule.mdc), [java-spring](../rules/java-spring/rule.mdc), [laravel](../rules/laravel/rule.mdc), [symfony](../rules/symfony/rule.mdc), [zend-framework](../rules/zend-framework/rule.mdc)).

Seguir [cognitive-complexity](../rules/cognitive-complexity/rule.mdc), [architecture](../rules/architecture/rule.mdc), [errors-and-logging](../rules/errors-and-logging/rule.mdc).

---

**0. Capturar baseline antes de qualquer mudança**

Executar e registrar o estado inicial:

Descobrir comandos: [_shared/detect-package-manager.md](./_shared/detect-package-manager.md) + `package.json` / `Makefile`.

Executar os testes e anotar: total de testes, contagem pass/fail, e cobertura se o projeto medir (`--coverage`, `go test -cover`, etc.). Este snapshot é o critério de comparação ao final — **não prosseguir se houver testes falhando no baseline**; reportar ao usuário e aguardar instrução.

---

**1. Inspecionar e listar smells sem modificar**

Ler o alvo completo e listar os problemas encontrados com referência `path:linha`:

- **Complexidade ciclomática alta** — função com mais de 10 branches (if/else/switch/ternário aninhado).
- **Responsabilidades mistas** — um único arquivo ou função que faz I/O, lógica de negócio e formatação de resposta ao mesmo tempo.
- **Duplicação** — bloco de código com lógica equivalente repetida em 2+ lugares.
- **Acoplamento temporal** — funções que só funcionam se chamadas em ordem específica sem que isso seja expresso no tipo.
- **Magic numbers/strings** — valores literais sem nome sem contexto aparente.
- **Erro mal mapeado** — exceção capturada e descartada, ou relançada sem contexto adicional.
- **Nomes opacos** — variável ou função cujo nome não revela intenção (`data`, `result`, `handleIt`).
- **Violação de Deméter** — cadeia de acessos `a.b.c.d.method()` atravessando camadas.

Apresentar a lista completa ao usuário antes de começar qualquer mudança. Aguardar confirmação ou ajuste de escopo.

---

**2. Uma preocupação por passo, com limite de escopo**

Cada passo deve tocar **no máximo 1 arquivo por vez** e fazer **uma única transformação** (extrair helper, renomear símbolo, mover arquivo, simplificar condição, etc.).

Após cada passo:

1. Executar **apenas os testes diretamente relacionados ao arquivo alterado** — se o projeto tiver watch mode ou filtro por path, usá-lo. Executar a suite completa apenas se não for possível filtrar.
2. Confirmar que o resultado bate com o baseline: mesma contagem pass, sem novos fail.
3. Se algum teste falhar após o passo, **desfazer a mudança imediatamente** antes de prosseguir.

---

**3. Proibições**

- **Proibido** adicionar features ou corrigir bugs não relacionados ao refactor — registrá-los no resumo como "detectado, fora do escopo".
- **Proibido** alterar a assinatura pública de funções/métodos/exports sem aprovação explícita do usuário.
- **Proibido** fazer dois tipos de transformação no mesmo passo (ex.: renomear E mover no mesmo commit).

---

**4. Critérios de conclusão (todos devem ser ✅)**

Ao final, executar a suite completa e verificar:

- [ ] **Testes passam:** mesma contagem de pass que o baseline; nenhum teste novo em fail.
- [ ] **Cobertura igual ou maior:** se o projeto mede cobertura, o delta deve ser ≥ 0%.
- [ ] **Linter sem novos warnings:** inspecionar `package.json` scripts ou `Makefile` para o comando correto do projeto e executá-lo; confirmar que não há warnings novos introduzidos pelo refactor.
- [ ] **Nenhum breaking change não aprovado:** a assinatura pública dos símbolos alterados permanece compatível, ou breaking foi explicitamente aprovado pelo usuário antes de ser feito.
- [ ] **Bugs fora do escopo registrados:** problemas encontrados mas não corrigidos estão listados no resumo final, não silenciados.

---

**5. Resumo final obrigatório**

Ao concluir, produzir:

- Lista de cada transformação aplicada com `path:linha` antes/depois.
- Resultado da suite de testes (pass/fail/cobertura).
- Lista de problemas detectados mas deixados fora do escopo (para o usuário criar issues/tasks).
