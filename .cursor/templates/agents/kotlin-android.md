# Agent guide — <!-- TODO: nome do app -->

Referência para assistentes de IA — Android (Kotlin) / Compose.

## Stack

- **Kotlin:** <!-- TODO: versão (libs.versions.toml) -->
- **UI:** <!-- TODO: Jetpack Compose | Views -->
- **DI:** <!-- TODO: Hilt | Koin -->
- **Networking:** <!-- TODO: Retrofit, Ktor -->
- **Tests:** JUnit, Espresso / Compose UI Test

## Where to put code

| Concern | Location |
|---------|----------|
| App module | `app/src/main/` |
| UI (Compose) | `app/src/main/kotlin/**/ui/` ou por feature |
| ViewModels | `**/presentation/` ou colocated na feature |
| Domain | `**/domain/` |
| Data / API | `**/data/` |
| KMP shared (se usar) | `shared/src/commonMain/kotlin/` |

UI reativa ao ViewModel; sem regra de negócio pesada em Composables.

## Conventions

- Tokens sensíveis: EncryptedSharedPreferences / Keystore — **não** SharedPreferences em claro.
- Navegação: <!-- TODO: Navigation Compose, deeplinks documentados no README -->
- Conventional Commits.

## Useful scripts

```bash
./gradlew :app:assembleDebug
./gradlew :app:testDebugUnitTest
./gradlew lint
```

## Onboarding

<!-- TODO: README, local.properties, flavors -->

## Cursor

Rules transversais (`architecture`, `cognitive-complexity`) + **`java-security` via picker** (globs JVM não cobrem Android automaticamente para evitar falso positivo com backend). Não misturar com `java-spring` salvo módulo backend no mesmo repo · [.cursor/PORTABILITY.md](.cursor/PORTABILITY.md)
