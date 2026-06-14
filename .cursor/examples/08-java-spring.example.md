# Exemplo 08 — java-spring/rule.mdc + java-security.mdc
# Constructor injection, @Transactional, @ControllerAdvice, paginação obrigatória

**Rules ativas:** `java-spring/rule.mdc` (Maven/Gradle/Spring + `src/main/java` / `src/main/kotlin` na raiz), `java-security.mdc` (`**/*.java` + `src/main/kotlin/**/*.kt`; Android `app/src/main/kotlin` e KMP → picker)

---

## Prompt de entrada

```
Crie um endpoint GET /invoices que lista faturas do usuário autenticado,
com paginação. Stack: Java + Spring Boot + JPA.
```

---

## Output CORRETO (esperado)

```java
// InvoiceController.java
@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor  // ✅ constructor injection via Lombok — proibido @Autowired em campo
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<Page<InvoiceResponse>> listInvoices(
            @AuthenticationPrincipal UserDetails principal,  // ✅ identidade do token, não do body
            @PageableDefault(size = 20, sort = "createdAt", direction = DESC) Pageable pageable
    ) {
        // ✅ controller magro — só delega, sem lógica de negócio
        Page<InvoiceResponse> invoices = invoiceService.findByUser(principal.getUsername(), pageable);
        return ResponseEntity.ok(invoices);
    }
}
```

```java
// InvoiceService.java
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;

    @Transactional(readOnly = true)  // ✅ @Transactional no serviço, não no controller
    public Page<InvoiceResponse> findByUser(String userId, Pageable pageable) {
        // ✅ paginação obrigatória — nunca findAll() sem Pageable
        return invoiceRepository.findByUserId(userId, pageable)
                .map(InvoiceResponse::from);  // ✅ mapeamento DTO — entidade JPA não exposta
    }
}
```

```java
// InvoiceRepository.java
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    // ✅ query parametrizada via Spring Data — proibido JPQL com concatenação
    Page<Invoice> findByUserId(String userId, Pageable pageable);
}
```

```java
// GlobalExceptionHandler.java — handler central, não try/catch em cada método
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(InvoiceNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(InvoiceNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(NOT_FOUND, ex.getMessage());
        problem.setProperty("code", ex.getCode());  // ✅ code estável legível por máquina
        return ResponseEntity.status(NOT_FOUND).body(problem);
        // ✅ sem stack trace ao cliente
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpected(Exception ex, HttpServletRequest req) {
        log.error("Unexpected error at {}", req.getRequestURI(), ex);  // ✅ log servidor com contexto
        ProblemDetail problem = ProblemDetail.forStatus(INTERNAL_SERVER_ERROR);
        problem.setDetail("An unexpected error occurred");  // ✅ mensagem genérica ao cliente
        return ResponseEntity.status(INTERNAL_SERVER_ERROR).body(problem);
    }
}
```

**Por que está correto:**
- Constructor injection via `@RequiredArgsConstructor` — sem `@Autowired` em campo.
- `@AuthenticationPrincipal` — identidade vem do token validado, não do body/query.
- `@PageableDefault` + `Pageable` — paginação obrigatória, nunca `findAll()` sem limite.
- `@Transactional(readOnly = true)` no serviço, não no controller.
- Entidade JPA nunca exposta diretamente — mapeamento para `InvoiceResponse` no serviço.
- `@RestControllerAdvice` centralizado — sem try/catch espalhado em cada método.
- `ProblemDetail` (RFC 9457, successor of RFC 7807) com `code` estável.

---

## Output INCORRETO (proibido pelas rules)

```java
// ❌ Viola java-spring/rule.mdc e java-security.mdc
@RestController
public class InvoiceController {

    @Autowired  // ❌ @Autowired em campo — proibido
    private InvoiceRepository invoiceRepository;

    @GetMapping("/invoices")
    public List<Invoice> getInvoices(
            @RequestParam String userId  // ❌ userId cru do query param — forjável pelo cliente
    ) {
        // ❌ lógica de negócio no controller
        if (userId == null || userId.isEmpty()) {
            throw new RuntimeException("userId required");  // ❌ RuntimeException genérica sem code
        }

        // ❌ findAll() sem paginação — pode retornar milhões de registros
        List<Invoice> all = invoiceRepository.findAll();

        // ❌ filtragem em memória — deveria ser feita no banco com query parametrizada
        return all.stream()
                .filter(i -> i.getUserId().equals(userId))
                .collect(Collectors.toList());

        // ❌ entidade JPA retornada diretamente — expõe campos internos, lazy loading fora de sessão
    }
}
```

**Por que está errado:**
- `@Autowired` em campo — proibido por `java-spring/rule.mdc`.
- `userId` vem de `@RequestParam` — forjável; identidade deve vir do token (`@AuthenticationPrincipal`).
- `findAll()` sem paginação — potencial OOM com tabelas grandes.
- Filtragem em memória — performance e segurança (carrega dados de todos os usuários).
- Entidade JPA retornada diretamente — vaza campos internos, quebra a camada de domínio.
- `RuntimeException` sem `code` — não é legível por máquina, dificulta monitoramento.
