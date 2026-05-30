# Exemplo 09 — php/rule.mdc + laravel/rule.mdc + php-security.mdc
# Controller magro, Form Request, Resource, Policy (IDOR), paginação obrigatória

**Rules ativas:** `php/rule.mdc` (auto-attach via `**/*.php`), `laravel/rule.mdc` (overlay manual), `php-security.mdc` (auto-attach via `**/*.php`)

---

## Prompt de entrada

```
Crie um endpoint GET /invoices que lista faturas do usuário autenticado,
com paginação. Stack: PHP + Laravel + Eloquent.
```

---

## Output CORRETO (esperado)

```php
<?php
// app/Http/Controllers/InvoiceController.php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class InvoiceController extends Controller
{
    // ✅ controller magro — só delega, sem lógica de negócio
    public function index(Request $request): AnonymousResourceCollection
    {
        // ✅ identidade vem do token validado pelo servidor, não do body/query string
        $user = $request->user();

        // ✅ paginação obrigatória — nunca all() ou get() em tabela que cresce
        $invoices = Invoice::query()
            ->where('user_id', $user->id)  // ✅ filtragem por dono do recurso (IDOR)
            ->latest()
            ->paginate(perPage: $request->integer('per_page', 20));

        // ✅ Resource para serialização — modelo Eloquent nunca retornado diretamente
        return InvoiceResource::collection($invoices);
    }
}
```

```php
<?php
// app/Http/Resources/InvoiceResource.php
declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class InvoiceResource extends JsonResource
{
    // ✅ whitelist explícita de campos expostos — sem vazar campos internos
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,          // ✅ UUID, não ID sequencial
            'amount'     => $this->amount,
            'status'     => $this->status,
            'due_date'   => $this->due_date?->toDateString(),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
```

```php
<?php
// app/Http/Requests/StoreInvoiceRequest.php
declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        // ✅ autorização centralizada aqui ou via Policy
        return true;
    }

    // ✅ regras de validação explícitas — proibido $request->all() sem whitelist
    public function rules(): array
    {
        return [
            'amount'   => ['required', 'numeric', 'min:0.01', 'max:999999.99'],
            'due_date' => ['required', 'date', 'after:today'],
            'notes'    => ['nullable', 'string', 'max:500'],
        ];
    }
}
```

```php
<?php
// app/Policies/InvoicePolicy.php
declare(strict_types=1);

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

final class InvoicePolicy
{
    // ✅ Policy centraliza autorização — proibido if ($user->id === $invoice->user_id) espalhado
    public function view(User $user, Invoice $invoice): bool
    {
        // ✅ verifica ownership — previne IDOR
        return $user->id === $invoice->user_id;
    }

    public function update(User $user, Invoice $invoice): bool
    {
        return $user->id === $invoice->user_id
            && $invoice->status === 'pending';
    }
}
```

```php
<?php
// app/Exceptions/Handler.php (trecho do handler global)
declare(strict_types=1);

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

// ✅ handler global — sem try/catch espalhado em cada controller
->withExceptions(function (Exceptions $exceptions): void {

    $exceptions->render(function (ModelNotFoundException $e): Response {
        return response()->json([
            'code'    => 'resource_not_found',   // ✅ code estável legível por máquina
            'message' => 'Resource not found.',  // ✅ mensagem genérica ao cliente
        ], 404);
        // ✅ sem stack trace, sem path de arquivo
    });

    $exceptions->render(function (AuthorizationException $e): Response {
        return response()->json([
            'code'    => 'forbidden',
            'message' => 'This action is unauthorized.',
        ], 403);
    });
})
```

**Por que está correto:**
- `declare(strict_types=1)` no topo de todo arquivo PHP.
- Controller magro: sem lógica de negócio, apenas delega e mapeia resposta.
- Identidade via `$request->user()` (token validado) — nunca `$request->input('user_id')`.
- `paginate()` obrigatório — nunca `all()` ou `get()` sem limit em tabelas que crescem.
- `InvoiceResource` serializa whitelist explícita — modelo Eloquent nunca exposto diretamente.
- `FormRequest` com `rules()` explícito — proibido `$request->all()` sem validação.
- `InvoicePolicy` centraliza autorização + verificação de ownership (IDOR).
- Handler global de exceções com mensagem genérica ao cliente e `code` estável.

---

## Output INCORRETO (proibido pelas rules)

```php
<?php
// ❌ Viola php/rule.mdc, laravel/rule.mdc e php-security.mdc
// ❌ Falta declare(strict_types=1)

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;

class InvoiceController extends Controller  // ❌ não é final
{
    public function index(Request $request)  // ❌ sem tipo de retorno
    {
        // ❌ userId cru do query param — forjável pelo cliente
        $userId = $request->input('user_id');

        // ❌ nenhuma validação do input
        if (!$userId) {
            return response()->json(['error' => 'user_id required'], 400);
        }

        // ❌ all() sem paginação — pode retornar milhares de registros / OOM
        $invoices = Invoice::all();

        // ❌ filtragem em memória — carrega dados de TODOS os usuários
        $filtered = $invoices->filter(fn($i) => $i->user_id == $userId);

        // ❌ modelo Eloquent retornado diretamente — expõe campos internos e sensíveis
        return response()->json($filtered->values());
    }

    public function show(Request $request, int $id)  // ❌ ID sequencial exposto
    {
        // ❌ busca sem verificar ownership — vulnerabilidade IDOR
        $invoice = Invoice::find($id);

        // ❌ stack trace exposto ao cliente via dd() / var_dump()
        dd($invoice);

        // ❌ SQL com concatenação de input — SQL Injection
        $raw = \DB::select("SELECT * FROM invoices WHERE id = " . $id);

        return response()->json($invoice);
    }
}
```

**Por que está errado:**
- Sem `declare(strict_types=1)` — viola `php/rule.mdc`.
- `$request->input('user_id')` — identidade forjável; deve vir do token validado pelo servidor.
- `Invoice::all()` sem paginação — potencial OOM com tabelas grandes.
- Filtragem em memória — carrega dados de todos os usuários, violação de isolamento.
- Modelo Eloquent retornado diretamente — vaza campos internos (`password_hash`, `remember_token`, etc.).
- `Invoice::find($id)` sem verificar `user_id` — IDOR clássico, qualquer usuário acessa qualquer fatura.
- `dd()` / `var_dump()` — expõe internals do servidor; proibido em produção.
- SQL com concatenação — SQL Injection; proibido por `php-security.mdc`.
- Classe não é `final` — facilita herança indevida.
