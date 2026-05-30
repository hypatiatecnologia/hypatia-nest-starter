# Exemplo — transação com BaseRepository (Idea)

Referência opcional para [company-patterns/rule.mdc](../company-patterns/rule.mdc). Use o padrão **já existente** no repositório (`BaseRepository`, helpers de transação).

```typescript
const transaction = await repository.initializeTransaction();
try {
  await repositoryA.save(data, transaction);
  await repositoryB.update(id, patch, transaction);
  await repository.commitTransaction(transaction);
} catch (error) {
  await repository.rollbackTransaction(transaction);
  throw error;
}
```

Se o repo tiver `docs/company-patterns-examples.md`, preferir esse documento local.
