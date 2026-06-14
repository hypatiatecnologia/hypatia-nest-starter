# Agent guide — <!-- TODO: nome do app -->

Referência para assistentes de IA — React Native / Expo.

## Stack

- **Runtime:** <!-- TODO: Expo | bare React Native -->
- **Navigation:** <!-- TODO: Expo Router | React Navigation -->
- **State / data:** <!-- TODO: TanStack Query, Zustand -->
- **Auth / storage:** Secure storage para tokens — não AsyncStorage para secrets
- **Tests:** <!-- TODO: Jest, Detox, Maestro -->

## Where to put code

| Concern | Location |
|---------|----------|
| Screens | <!-- TODO: `app/` (Expo Router) ou `src/screens/` --> |
| Components | `src/components/` |
| Features | `src/features/[domain]/` |
| API client | `src/lib/api/` |
| Native modules | `modules/` (se bare) |

## Conventions

- Listas longas: `FlatList` / `FlashList` com `keyExtractor` estável.
- Deep links documentados no README.
- Conventional Commits.

## Useful scripts

```bash
npx expo start          # TODO: ajustar
npm run test
npm run lint
```

## Onboarding

<!-- TODO: README, EAS, variáveis de ambiente -->

## Cursor

Rules: `typescript-react-native` (picker se globs não cobrirem) · `/review-mobile-ui` · [.cursor/PORTABILITY.md](.cursor/PORTABILITY.md)
