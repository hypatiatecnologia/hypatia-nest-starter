# Exemplo 11 — remix-fsd/rule.mdc
# Rota Remix magra + feature FSD + Zod + Supabase SSR

**Rules ativas:** `remix-fsd/rule.mdc`, `typescript-react/rule.mdc`, `typescript-security.mdc`

---

## Prompt de entrada

```
Adicione uma action de login na rota existente. Stack: React Router v7 / Remix,
Supabase SSR, Zod. O formulário já existe em src/features/auth/components/.
```

---

## Output CORRETO (esperado)

```typescript
// app/routes/_auth.login.tsx — rota magra
import { redirect, useActionData } from "react-router";

import { authenticateLogin } from "@/features/auth/actions";
import { LoginForm } from "@/features/auth/components/login-form";

import type { Route } from "./+types/_auth.login";

export async function action({ request }: Route.ActionArgs) {
  const result = await authenticateLogin(request, await request.formData());

  if (!result.ok) {
    return result.errors;
  }

  return redirect("/app", { headers: result.headers });
}

export default function LoginRoute() {
  const actionData = useActionData<typeof action>();
  return <LoginForm actionData={actionData} />;
}

// src/features/auth/schemas.ts — Zod compartilhado cliente/servidor
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// src/features/auth/actions.ts — negócio e Supabase na feature
export async function authenticateLogin(
  request: Request,
  formData: FormData,
): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { ok: false, errors: { fieldErrors: formatZodErrors(parsed.error) } };
  }

  const { supabase, headers } = getServerClient(request);
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { ok: false, errors: { formError: error.message } };
  }

  return { ok: true, headers };
}

// src/features/auth/components/login-form.tsx — <Form> do React Router
<Form method="post">
  <Input name="email" type="email" />
  <Input name="password" type="password" />
  <Button type="submit">Entrar</Button>
</Form>
```

**Por que está correto:**
- Rota só orquestra: chama `authenticateLogin` e trata `{ ok, errors }`.
- Validação Zod na feature (`schemas.ts`), reutilizável no cliente.
- Supabase SSR via `getServerClient(request)` — sessão em cookies, não no bundle.
- `<Form method="post">` nativo do React Router — sem `fetch` manual no submit.
- Redirect com `headers` de sessão quando login ok.
- **Não** usa Server Actions, `class-validator`, Prisma nem lógica de auth na rota.

---

## Output INCORRETO (proibido pelas rules)

```typescript
// ❌ Viola remix-fsd + typescript-react + typescript-security

"use server"; // ❌ Server Actions do Next.js — proibido em Remix

import { createClient } from "@supabase/supabase-js";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  // ❌ validação inline sem Zod compartilhado
  const email = formData.get("email") as string;

  // ❌ Supabase e regra de negócio direto na rota
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ❌ service role exposta
  );
  const { error } = await supabase.auth.signInWithPassword({ email, password: "..." });
  console.log("login", email); // ❌ dado sensível em log
  if (error) throw error; // ❌ stack na resposta
  return redirect("/app");
}

// ❌ fetch manual no componente quando <Form> bastaria
function LoginForm() {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await fetch("/login", { method: "POST", body: new FormData(e.target) });
  };
}
```

**Por que está errado:**
- `"use server"` e padrões Next.js App Router — stack errado.
- Lógica Supabase e validação na rota — viola FSD (`src/features/auth/`).
- Service role key no servidor de rota sem abstração SSR.
- Email em `console.log` — viola segurança e logging.
- `throw error` na action — fluxo imprevisível; usar envelope `{ ok, errors }`.
- `fetch` manual no submit — usar `<Form>` do React Router.
