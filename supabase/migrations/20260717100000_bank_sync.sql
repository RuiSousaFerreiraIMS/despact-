-- Migração 0006 — Sincronização bancária (V2 Sprint 5, D-009)
--
-- Proveniência de movimentos e infra-estrutura de Open Banking: consentimentos
-- (`bank_connections`) e mapeamento banco↔Despact (`bank_account_links`).
-- A deduplicação é garantida na base de dados: repetir uma sincronização
-- nunca duplica movimentos.

-- 1. Proveniência nos movimentos -------------------------------------------

create type public.transaction_source as enum ('manual', 'bank');

alter table public.transactions
  add column source public.transaction_source not null default 'manual',
  add column external_id text check (external_id is null or btrim(external_id) <> '');

comment on column public.transactions.external_id is
  'Identificador do movimento no fornecedor bancário (D-009); único por utilizador para deduplicação.';

create unique index transactions_user_external_id_key
  on public.transactions (user_id, external_id)
  where external_id is not null;

-- 2. Consentimentos bancários -------------------------------------------------

create table public.bank_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'gocardless',
  requisition_id text not null,
  institution_id text not null,
  institution_name text not null,
  -- pending: consentimento iniciado; linked: contas mapeadas;
  -- expired/revoked: exige nova ligação.
  status text not null default 'pending'
    check (status in ('pending', 'linked', 'expired', 'revoked')),
  consent_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, requisition_id),
  unique (id, user_id)
);

comment on table public.bank_connections is
  'Consentimentos PSD2 (D-009). Nunca guarda credenciais bancárias; apenas referências do fornecedor.';

create index bank_connections_user_idx on public.bank_connections (user_id);

create trigger bank_connections_set_updated_at
  before update on public.bank_connections
  for each row
  execute function public.set_updated_at();

-- 3. Mapeamento conta bancária ↔ conta Despact -------------------------------

create table public.bank_account_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  connection_id uuid not null,
  account_id uuid not null,
  external_account_id text not null,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Chaves compostas: a ligação, a conexão e a conta pertencem todas ao
  -- mesmo utilizador.
  foreign key (connection_id, user_id)
    references public.bank_connections (id, user_id) on delete cascade,
  foreign key (account_id, user_id)
    references public.accounts (id, user_id),
  -- Uma conta bancária externa alimenta no máximo uma conta Despact.
  unique (user_id, external_account_id),
  -- E uma conta Despact é alimentada no máximo por uma conta bancária.
  unique (user_id, account_id)
);

create index bank_account_links_user_idx on public.bank_account_links (user_id);

create trigger bank_account_links_set_updated_at
  before update on public.bank_account_links
  for each row
  execute function public.set_updated_at();

-- 4. Row Level Security ---------------------------------------------------------

alter table public.bank_connections enable row level security;
alter table public.bank_account_links enable row level security;

-- Conexões e ligações não são histórico financeiro: podem ser removidas
-- (revogar um consentimento não apaga movimentos já importados).
create policy "bank_connections_select_own" on public.bank_connections
  for select to authenticated using (auth.uid() = user_id);
create policy "bank_connections_insert_own" on public.bank_connections
  for insert to authenticated with check (auth.uid() = user_id);
create policy "bank_connections_update_own" on public.bank_connections
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "bank_connections_delete_own" on public.bank_connections
  for delete to authenticated using (auth.uid() = user_id);

create policy "bank_account_links_select_own" on public.bank_account_links
  for select to authenticated using (auth.uid() = user_id);
create policy "bank_account_links_insert_own" on public.bank_account_links
  for insert to authenticated with check (auth.uid() = user_id);
create policy "bank_account_links_update_own" on public.bank_account_links
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "bank_account_links_delete_own" on public.bank_account_links
  for delete to authenticated using (auth.uid() = user_id);
