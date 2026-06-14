# Agent guide — <!-- TODO: nome do projeto -->

Referência para assistentes de IA — Spring Boot + Kotlin (JVM backend).

## Stack

- **Kotlin:** <!-- TODO: ex. 2.0+ (ver build.gradle.kts) -->
- **Build:** <!-- TODO: Gradle (Kotlin DSL) | Maven -->
- **Spring Boot:** <!-- TODO: versão -->
- **Persistence:** <!-- TODO: JPA/Hibernate, R2DBC, Exposed -->
- **Tests:** JUnit 5 + <!-- TODO: Kotest se o projeto usar -->

## Where to put code

| Concern | Location |
|---------|----------|
| REST controllers | `src/main/kotlin/**/controller/` |
| Services / use cases | `src/main/kotlin/**/service/` |
| Entities / repos | `src/main/kotlin/**/entity/`, `repository/` |
| DTOs | `data class` em `dto/` ou colocated |
| Config | `src/main/kotlin/**/config/` |
| Exception handling | `@RestControllerAdvice` global |

Controllers magros; regras nos services; `@Valid` / Bean Validation na borda.

## Conventions (Kotlin idiomático)

- Constructor injection apenas — sem `@Autowired` em campo.
- `data class` para DTOs; `sealed class` / `sealed interface` para erros/estados quando reduzir branching.
- Evitar `!!`; preferir `?.let`, `requireNotNull`, early return.
- Coroutines só onde o projeto já adota (WebFlux, suspend repos) — não introduzir Rx sem necessidade.
- `@Transactional` na camada de serviço, não no controller.
- Conventional Commits.

## Useful scripts

```bash
./gradlew bootRun          # ou ./mvnw spring-boot:run
./gradlew test
./gradlew build
```

## Onboarding

<!-- TODO: README, application.yml / application.properties profiles -->

## Cursor

Rules: `java-spring`, `java-security` (auto-attach em `src/main/kotlin/**/*.kt`, `build.gradle.kts`, `pom.xml`) · [.cursor/PORTABILITY.md](.cursor/PORTABILITY.md)
