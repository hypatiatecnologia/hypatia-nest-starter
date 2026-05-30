---
description: Gera ou amplia testes para um alvo; executa runner real; não altera código de produção.
---

**Objetivo:** cobrir lacunas de teste e reportar resultado do runner.

**Quando usar:** módulo/feature sem cobertura adequada.

**Não usar quando:** só explicar código → [`explain`](./explain.md).

**Done when:** relatório do Passo 3 preenchido; testes passando ou gaps listados.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

**Alvo:** arquivo(s), pacote ou descrição do comportamento a testar — definir no mesmo turno.

Seguir a rule [tester](../rules/tester/rule.mdc). APIs Node/TS públicas incluir também [openapi-contracts](../rules/openapi-contracts/rule.mdc). Spring/Java seguir bullets JVM no tester + [java-spring](../rules/java-spring/rule.mdc).

**Proibido** modificar arquivos de produção neste comando. Se um teste exigir mudança no código de produção para ser testável (ex.: injeção de dependência ausente), reportar como gap separado e aguardar instrução do usuário — não alterar.

---

## Passo 0 — Ler o contexto antes de escrever qualquer teste

Executar nesta ordem antes de escrever uma linha de teste:

1. **Ler o alvo** — entender o que o código faz, seus contratos públicos, seus caminhos de erro e suas dependências externas.

2. **Ler os testes existentes** — identificar:
   - Framework de teste em uso (`jest`, `vitest`, `pytest`, `testing`, `JUnit`, etc.)
   - Padrão de naming dos testes (`describe/it`, `test('should...')`, `func Test...`, `def test_...`)
   - Como mocks e stubs são criados no projeto (`jest.fn()`, `unittest.mock`, `gomock`, `Mockito`)
   - Estrutura de fixtures e factories usadas
   - Onde ficam os testes (junto ao código ou em `tests/` separado)

3. **Identificar o runner** — [_shared/detect-package-manager.md](./_shared/detect-package-manager.md) + scripts reais em `package.json` / `Makefile` / `go test`. Nunca inventar comando genérico.

Escrever testes que **se encaixam** no padrão já existente — naming, estrutura, mocks e fixtures consistentes com o restante do projeto.

---

## Passo 1 — Mapear lacunas por categoria

Para o alvo inspecionado, listar as lacunas encontradas organizadas por categoria. Apresentar ao usuário antes de escrever qualquer teste e aguardar confirmação ou ajuste de escopo.

### Categorias de lacuna

| Categoria | O que verificar |
|---|---|
| **Caminho feliz** | O comportamento esperado com input válido e dependências funcionando |
| **Input inválido** | Campos ausentes, tipos errados, strings vazias, valores fora do range, payloads malformados |
| **Valores limite** | Exatamente no limite (0, 1, MAX, MAX-1), não apenas dentro da faixa |
| **Contrato de erro** | Quais exceções/códigos de erro são lançados para cada condição — o caller precisa confiar nesses contratos |
| **Dependência ausente / falha externa** | O que acontece quando banco, cache, fila ou API externa retorna erro ou timeout |
| **Idempotência** | Chamar duas vezes com o mesmo input produz o mesmo resultado sem efeito colateral duplicado |
| **Concorrência** | Race conditions em recursos compartilhados — apenas se o código explicitamente usa goroutines, workers ou estado compartilhado |
| **Autenticação / autorização** | Endpoint rejeita request sem token ou com papel insuficiente — apenas se há superfície HTTP |

Listar cada lacuna como: `[categoria] descrição do comportamento não testado — path:linha do código correspondente`.

---

## Passo 2 — Escrever os testes em incrementos verificáveis

Não escrever todos os testes de uma vez. Trabalhar em grupos pequenos por categoria:

1. Escrever testes de **uma categoria** por vez.
2. Executar o runner **após cada grupo** — não acumular testes não executados.
3. Se algum teste falhar: corrigir **antes** de passar para a próxima categoria.
4. Se a falha exigir mudança no código de produção: reportar ao usuário e aguardar instrução — não alterar o código de produção.

**Cada teste deve:**
- Ter nome que descreve o comportamento verificado, não o método chamado: `'deve retornar 404 quando afiliado não existe'`, não `'test getAffiliate'`
- Ter exatamente um `assert` / `expect` por comportamento (múltiplos asserts para o mesmo comportamento são aceitáveis, mas cada teste deve verificar uma coisa)
- Ser independente: não depender de estado deixado por outro teste
- Usar mocks/stubs apenas para dependências externas reais (banco, API, fila) — não mockar a lógica que está sendo testada

---

## Passo 3 — Executar e reportar

Após todos os testes escritos, executar a suite completa e reportar:

```
Testes gerados: {n} novos testes em {n} arquivos

Resultado:
  Pass : {n}
  Fail : {n}
  Skip : {n}

Cobertura (se disponível):
  Antes: {%} → Depois: {%} (delta: +{%})

Falhas remanescentes (se houver):
  {path:linha} — {motivo da falha}
  {ação necessária — gap no código de produção ou fixture faltando}

Lacunas não cobertas (fora do escopo desta execução):
  {categoria} — {descrição} — {motivo de não ter coberto}
```

Se houver falhas remanescentes que não podem ser corrigidas sem alterar código de produção: listar explicitamente como gaps acionáveis para o usuário.
