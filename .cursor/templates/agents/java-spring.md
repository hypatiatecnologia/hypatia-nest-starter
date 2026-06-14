# Agent guide — <!-- TODO: nome do projeto -->

Referência para assistentes de IA — Spring Boot.

## Stack

- **Java version:** <!-- TODO: ex. 21 -->
- **Build:** <!-- TODO: Maven | Gradle -->
- **Spring Boot:** <!-- TODO: versão -->
- **Persistence:** <!-- TODO: JPA/Hibernate, JDBC -->
- **Tests:** JUnit 5

## Where to put code

| Concern | Location |
|---------|----------|
| REST controllers | `src/main/java/**/controller/` |
| Services | `src/main/java/**/service/` |
| Entities / repos | `src/main/java/**/entity/`, `repository/` |
| DTOs / mappers | `dto/`, MapStruct se usado |
| Config | `src/main/java/**/config/` |
| Exception handling | `@ControllerAdvice` global |

Controllers magros; regras de negócio nos services; validação com Bean Validation nos DTOs.

## Conventions

- Pacotes por feature ou camada — seguir o layout já dominante do repo.
- Erros de domínio com código estável; HTTP derivado no advice.
- Conventional Commits.

## Useful scripts

```bash
./mvnw spring-boot:run     # ou ./gradlew bootRun
./mvnw test
./mvnw verify
```

## Onboarding

<!-- TODO: README, application.yml profiles -->

## Cursor

Rules: `java-spring`, `java-security` · [.cursor/PORTABILITY.md](.cursor/PORTABILITY.md)
