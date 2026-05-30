---
description: Triage de bug — causa raiz, fix mínimo e teste de regressão. Use Debug Mode do Cursor se reprodução for opaca.
---

**Objetivo:** diagnosticar erro e propor fix mínimo + teste de regressão.

**Quando usar:** stack trace, comportamento inesperado, regressão após deploy.

**Não usar quando:** só entender código sem bug → [`explain`](./explain.md).

**Done when:** causa raiz declarada (ou hipótese + instrumentação), fix proposto, teste de regressão descrito.

Meta: [_shared/command-skeleton.md](./_shared/command-skeleton.md)

---

Cole erro, stack ou comportamento inesperado aqui ou no mesmo turno.

Seguir [errors-and-logging](../rules/errors-and-logging/rule.mdc); em TS ler também [typescript-security](../rules/security/typescript-security.mdc) até confirmar causa.

### Quando usar Debug Mode do Cursor

Se o bug for **reproduzível** mas a causa permanecer opaca após os passos 1–3 (race, estado global, timing, produção vs local): **sugerir ao usuário** ativar **Debug Mode** do Cursor (instrumentação com dados de runtime) em vez de acumular fixes especulativos. Este command continua com triage manual; Debug Mode complementa com evidência de execução.

---

**0. Sanitização — executar antes de qualquer análise**

Se dados sensíveis (tokens, CPFs, senhas, IPs internos, UUIDs de produção) estiverem no trace, mascarar imediatamente e **não** reproduzi-los em nenhuma saída. Continuar a análise com os valores mascarados.

---

**1. Classificar o problema antes de analisar**

Determinar e declarar explicitamente:

- **Ambiente:** produção / staging / local / CI — inferir do stack trace, URL ou contexto; perguntar se ambíguo.
- **Frequência:** determinístico / intermitente / regressão de deploy — inferir de qualquer pista disponível.
- **Severidade:** bloqueante (perda de dados, indisponibilidade) / degradação / cosmético.

A classificação determina o workflow: erros intermitentes exigem instrumentação antes do fix; erros de produção bloqueantes exigem fix mínimo antes de instrumentação adicional.

---

**2. Parse do stack trace**

De cima para baixo, associar cada frame a `path:linha` com base no projeto aberto. Distinguir:

- **Causa imediata** — o frame onde a exceção foi lançada.
- **Causa raiz** — o frame ou condição que tornou o lançamento inevitável (pode estar N frames abaixo).

Se a hipótese de causa raiz for fraca (ex.: frame em biblioteca de terceiros sem código-fonte, reprodução difícil), declarar como incerta e avançar para o passo 3 antes de propor fix.

Capturar também, quando disponível no contexto: versão do runtime/framework, `NODE_ENV` ou equivalente, e qualquer variável de ambiente relevante visível no trace — essas são causas raiz frequentes.

---

**3. Instrumentação quando a causa raiz for incerta**

Escrever o código de instrumentação pronto para usar — não apenas sugerir. O código deve:

- Usar o logger estruturado já presente no projeto (inspecionar `src/infra/logging`, `logger.ts`, `log.go`, etc.); se não existir, usar `console.error` com objeto JSON.
- Capturar o estado mínimo necessário para confirmar a hipótese: valor da variável suspeita, resultado intermediário, ID de correlação.
- Ser removível com um único delete sem deixar rastro funcional.

Exemplo de formato:

```typescript
// DEBUG TEMP — remover após confirmar causa
logger.debug({ suspectValue, correlationId: req.id }, 'debug: checkpoint antes do crash')
```

---

**4. Fix mínimo**

Propor o menor conjunto de mudanças que resolve o problema sem:

- Mover lógica de negócio para camadas erradas — seguir [architecture](../rules/architecture/rule.mdc).
- Introduzir side effects fora do escopo do bug.
- Silenciar o erro sem tratamento (catch vazio, `|| null` sem log).

Se o fix correto exigir mudança maior (ex.: refactor de camada), propor o fix temporário mais seguro e registrar a dívida explicitamente.

---

**5. Teste de regressão**

Propor **um** teste conforme [tester](../rules/tester/rule.mdc) que:

- Reproduz a condição que causou o bug (não apenas verifica o happy path).
- Falharia no código antes do fix e passa depois.
- É o mais unitário possível — evitar teste de integração se um unitário for suficiente para cobrir a causa raiz.
