# Configuração global do Cursor (`~/.cursor`)

Centralize rules, commands, hooks e templates **uma vez no Mac** e evite copiar `.cursor/` para cada repositório.

## Quando usar

| Modo | Indicado para |
|------|----------------|
| **Global** (`~/.cursor`) | Uso pessoal; você atualiza o pack num lugar só |
| **Global + repo remoto** | Time ou várias máquinas; fonte única no Git |
| **Por projeto** (`<repo>/.cursor/`) | Time versiona convenções no git por produto |
| **Híbrido** | Global com 95% das rules; no repo só `AGENTS.md` e overrides pontuais |

Este guia cobre o modo **global** e o **global com repositório remoto**.

## Instalação inicial

**Máquina nova (recomendado):**

```bash
cd scafolding/cursor-config    # ou clone do repo cursor-config
./install.sh
```

Clone remoto + install:

```bash
./install.sh --clone git@github.com:seu-time/cursor-config.git
```

**Manual** (na raiz do repo fonte):

```bash
./scripts/sync-cursor-config.sh --global --force

# Opcional: Antigravity (specs) em ~/.gemini/
./scripts/sync-cursor-config.sh --global --force --gemini
```

O sync / install:

1. Sincroniza `.cursor/` → `~/.cursor/` (`rsync -a --delete`)
2. Copia **`hooks.global.json`** → `~/.cursor/hooks.json` (formato global versionado; fallback: sed em `hooks.json` de projeto)

Estrutura do repo compartilhado: [cursor-config/README.md](../cursor-config/README.md)

Simular sem gravar:

```bash
./scripts/sync-cursor-config.sh --global --dry-run
```

## O que fica em cada lugar

| Local | Conteúdo |
|-------|----------|
| `~/.cursor/` | `rules/`, `commands/`, `hooks/`, `hooks.json`, `templates/`, `examples/`, `antigravity/`, … |
| `~/.gemini/` | `GEMINI.md`, `AGENTS.md` (Antigravity global) — ver [antigravity/README.md](antigravity/README.md) |
| `<repo>/AGENTS.md` | Stack, scripts e “onde colocar código” **deste** projeto |
| `<repo>/.cursorignore` | Segredos e paths excluídos do contexto (por repo) |
| `<repo>/.cursorindexingignore` | Indexação (por repo) |
| Cursor Settings → Rules for AI | Opcional: texto de `user-rules/committing-changes-with-git.md` |

### Opcional por projeto

- **Sem** pasta `.cursor/` no repo — tudo vem do global.
- **Override** pontual: `<repo>/.cursor/commands/foo.md` sobrescreve o homônimo em `~/.cursor/commands/` (mesmo nome).

## O que não fazer

- **Não** criar symlink `<repo>/.cursor/rules` → `~/.cursor/rules` — duplica rules `alwaysApply` no contexto.
- **Não** manter `.cursor/` completo no repo **e** cópia idêntica em `~/.cursor` — escolha um modelo ou use só overrides no repo.
- **Não** usar `--agents` com `--global` — `AGENTS.md` pertence à raiz de cada projeto.

## Novo projeto (só global)

1. Clone o repo **sem** `.cursor/` local (ou remova se existir).
2. Crie `AGENTS.md` na raiz:

   ```bash
   cp ~/.cursor/templates/agents/nextjs.md ~/dev/meu-app/AGENTS.md
   # Edite <!-- TODO: ... --> e scripts reais
   ```

   Ou, a partir do repo fonte:

   ```bash
   ./scripts/sync-cursor-config.sh ~/dev/meu-app --agents nextjs --with-ignore --force
   ```

   (isso copia `.cursor/` **para o projeto** — use se quiser híbrido, não se for 100% global.)

3. Copie `.cursorignore` do template ou de outro repo se fizer sentido.

## Atualizar o pack global

Quando o pack evoluir no repositório **fonte** (local ou remoto):

```bash
cd ~/dev/cursor-config   # clone do repo canônico — ajuste o caminho
git pull
./scripts/sync-cursor-config.sh --global --force
```

Em cada máquina que usa o pack global, repita `git pull` + sync após mudanças no remoto (ou use symlink — ver abaixo).

## Repositório remoto (time / várias máquinas)

Sim — é possível (e recomendável para times) usar um **repositório Git remoto** como fonte da verdade. O Git não atualiza `~/.cursor` sozinho: cada máquina precisa de `git pull` e, se não usar symlink, `./scripts/sync-cursor-config.sh --global --force`.

### Estrutura sugerida do repo remoto

Repo dedicado (ex. `cursor-config`) ou pasta dentro de dotfiles:

```
cursor-config/               # raiz do git (repo dedicado)
├── install.sh               # onboarding — ver cursor-config/install.sh neste monorepo
├── README.md
├── .cursor/
│   ├── hooks.json           # formato projeto
│   ├── hooks.global.json    # formato ~/.cursor (versionado)
│   └── hooks/, rules/, commands/, …
└── scripts/
    └── sync-cursor-config.sh
```

Este repositório (`scafolding`) é a **fonte canônica**; a pasta [cursor-config/](../cursor-config/) documenta o layout e o `install.sh` para publicação remota.

### O que versionar no remoto

| Incluir | Evitar / cuidado |
|---------|------------------|
| `rules/`, `commands/`, `hooks/`, `templates/`, `examples/` | Segredos, tokens, paths locais da máquina |
| `scripts/sync-cursor-config.sh` | Cópias de `~/.cursor/skills-cursor/` (built-ins são gerenciadas pelo Cursor) |
| `GLOBAL-SETUP.md`, `PORTABILITY.md` | Configs pessoais do IDE — plugins são habilitados na UI do Cursor, por dev |
| `hooks.json` (projeto) + **`hooks.global.json`** (global versionado) | Commitar `AGENTS.md` de produtos — fica na raiz de cada app |

`AGENTS.md` **não** entra no repo central: permanece na raiz de cada repositório de produto.

### Modelo A — clone + sync (recomendado)

**Primeira vez em cada máquina:**

```bash
git clone git@github.com:seu-time/cursor-config.git ~/dev/cursor-config
cd ~/dev/cursor-config
./install.sh --force
```

Ou em um comando: `./install.sh --clone git@github.com:seu-time/cursor-config.git`

**Quando o remoto for atualizado:**

```bash
cd ~/dev/cursor-config && git pull && ./install.sh --force
```

Alias útil no `~/.zshrc`:

```bash
alias cursor-sync='cd ~/dev/cursor-config && git pull && ./install.sh --force'
```

Para o time: documente no README do repo remoto que, após merge de mudanças em `.cursor/`, cada dev roda `cursor-sync` (ou o CI interno avisa no Slack).

### Modelo B — symlink de `~/.cursor`

```bash
git clone git@github.com:seu-time/cursor-config.git ~/dev/cursor-config
cd ~/dev/cursor-config
./scripts/sync-cursor-config.sh --global --force   # gera hooks.json com paths hooks/…
mv ~/.cursor ~/.cursor.bak 2>/dev/null || true
ln -sfn ~/dev/cursor-config/.cursor ~/.cursor
```

Depois disso, `git pull` no clone atualiza os arquivos; **confira** se `hooks.json` no repo usa `hooks/…` (formato global). Se o repo versionar só o formato projeto (`.cursor/hooks/…`), rode o sync após cada pull ou versione `hooks.json` já no formato global no remoto.

### Modelo C — dotfiles (Stow, chezmoi, yadm)

O mesmo `.cursor/` pode viver em `~/dotfiles/.cursor/` e ser publicado com GNU Stow (`stow cursor`), chezmoi ou yadm. Mesmas regras: não duplicar rules com symlink `<repo>/.cursor/rules` → `~/.cursor/rules` nos projetos de produto.

### Híbrido time + produto

| Camada | Onde |
|--------|------|
| Convenções universais | Repo remoto → `~/.cursor` |
| Stack do produto | `AGENTS.md` na raiz do app |
| Override pontual | `<app>/.cursor/commands/foo.md` vence o global homônimo |

### Propagação para todas as máquinas

| Gatilho | Ação |
|---------|------|
| Manual | `git pull` + `sync-cursor-config.sh --global --force` |
| Alias `cursor-sync` | Um comando após aviso do time |
| Cron / launchd (pessoal) | `pull` + sync periódico |
| Onboarding | README do repo remoto: clone + install na primeira vez |

Não há “auto-update” como npm: cada máquina precisa puxar o remoto (ou `~/.cursor` symlinkado ao clone).

### Limitações

1. **Cursor Settings → Rules for AI** (UI) fica fora do repo — copie `user-rules/committing-changes-with-git.md` manualmente ou documente no README.
2. **`~/.cursor/cli-config.json`** (CLI) é arquivo separado; pode ir no mesmo dotfiles se usar Cursor CLI.
3. **Máquina nova** — clone do repo remoto + install uma vez.
4. **Projeto com `.cursor/` versionado** — command/rule do repo ainda pode sobrescrever o global; evite duplicar o pack inteiro nos dois lugares.

## `hooks.json` — projeto vs global

| Arquivo | Escopo | Path dos hooks |
|---------|--------|----------------|
| `.cursor/hooks.json` | Projeto (raiz do app) | `.cursor/hooks/block-rm.sh` |
| `.cursor/hooks.global.json` | Fonte versionada para `~/.cursor` | `hooks/block-rm.sh` |
| `~/.cursor/hooks.json` | Instalado (cópia de `hooks.global.json`) | `hooks/block-rm.sh` |

Após `install.sh` ou `sync --global`:

```bash
cat ~/.cursor/hooks.json
# deve coincidir com .cursor/hooks.global.json no repo
```

## Verificação

1. Abra um projeto **sem** `.cursor/` local no Cursor.
2. Digite `/` no chat — commands (`/commit`, `/pr`, `/test`) devem listar.
3. Abra um arquivo da stack (ex. `.ts`, `nest-cli.json`) — rules por glob devem aplicar.
4. Hooks: o agent não deve executar `rm -rf` em paths críticos (hook `block-rm`).

Pergunte ao agent: *“quais rules de stack estão ativas neste arquivo?”*

## Precedência (resumo)

1. **Security** da linguagem em contexto
2. **architecture** + **cognitive-complexity**
3. Stack específica (globs)
4. Command do **repo** > command **global** (mesmo nome)

Detalhes: [rules/_shared/precedence.md](rules/_shared/precedence.md).

## Referências

- Portar para outro repo (por projeto): [PORTABILITY.md](PORTABILITY.md)
- Templates `AGENTS.md`: [templates/agents/README.md](templates/agents/README.md)
- Índice de rules: [rules/RULES.md](rules/RULES.md)
- Repo compartilhado: [cursor-config/README.md](../cursor-config/README.md)
- Onboarding: `cursor-config/install.sh`
- Sync manual: `scripts/sync-cursor-config.sh --global`
