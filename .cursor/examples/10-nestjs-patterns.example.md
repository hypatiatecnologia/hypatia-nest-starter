# Exemplo 10 — nestjs-patterns/rule.mdc
# Módulo NestJS alinhado ao hades-vault (controller magro, DTO, service, Prisma)

**Rules ativas:** `nestjs-patterns/rule.mdc`, `typescript-security.mdc`, `architecture/rule.mdc`

---

## Prompt de entrada

```
Adicione um endpoint POST /subjects/:id/vault/data no módulo vault para gravar PII
categorizado. Stack deste repo: NestJS + Prisma + class-validator.
```

---

## Output CORRETO (esperado)

```typescript
// src/modules/vault/dto/write-data.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class WriteDataDto {
  @ApiProperty({ example: 'account_management' })
  @IsString()
  purpose!: string;

  @ApiProperty({ example: { email: 'maria@example.com' } })
  @IsObject()
  data!: Record<string, string>;
}

// src/modules/vault/vault.controller.ts (trecho)
@Post(':subjectId/data')
@UseGuards(AppAuthGuard, ConsentGuard)
@RequireScopes('vault:write')
@Audit('vault.write')
async write(
  @Param('subjectId') subjectId: string,
  @Body() dto: WriteDataDto,
  @CurrentActor() actor: AppActor,
) {
  return this.vaultService.write(subjectId, actor.appId, dto.purpose, dto.data);
}

// src/modules/vault/vault.service.ts — regra de negócio no service, não no controller
async write(subjectId: string, appId: string, purpose: string, data: Record<string, string>) {
  const allowed = new Set(await this.allowedCategories(appId, purpose));
  const denied = Object.keys(data).filter((c) => !allowed.has(c));
  if (denied.length) {
    throw new ForbiddenException(`Categorias nao autorizadas: ${denied.join(', ')}`);
  }
  // ... cifragem via FieldEncryptionService + persistência Prisma
}
```

**Por que está correto:**
- Controller só orquestra guards, DTO e delegação ao service.
- Validação na borda com `class-validator` + `ValidationPipe` global.
- Exceções Nest (`ForbiddenException`) — sem stack trace na resposta.
- Minimização de categorias no service (LGPD).
- **Não** usa Yup, `IController`, `adaptRoute` ou `BaseRepository`.

---

## Output INCORRETO (proibido pelas rules)

```typescript
// ❌ Viola nestjs-patterns + architecture + typescript-security

// Yup no lugar de class-validator
import * as yup from 'yup';
const schema = yup.object({ purpose: yup.string().required() });

export class VaultController {
  // ❌ lógica de negócio e Prisma direto no controller
  @Post(':subjectId/data')
  async write(@Param('subjectId') subjectId: string, @Body() body: any) {
    const parsed = await schema.validate(body);
    const items = await this.prisma.personalDataItem.findMany({ where: { subjectId } });
    for (const key of Object.keys(parsed.data)) {
      await this.prisma.personalDataItem.create({ data: { subjectId, categoryCode: key, ciphertext: parsed.data[key] } });
    }
    console.log('gravado', parsed.data); // ❌ PII em log
    return { ok: true };
  }
}
```

**Por que está errado:**
- Yup e `body: any` — padrão Idea/legado, não Nest deste repo.
- Prisma e regra de minimização no controller — viola camadas.
- PII em `console.log` — proibido por segurança e logging estruturado.
- Sem guards de escopo/consentimento na rota sensível.
