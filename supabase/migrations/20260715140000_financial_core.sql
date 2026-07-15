-- Migração 0002 — Núcleo financeiro (Sprint 2)
--
-- Cria `accounts`, `categories` e `transactions` conforme DATABASE.md e as
-- decisões D-001..D-005: dinheiro em inteiros de unidades mínimas, saldo
-- derivado, transferências como pares atómicos e isolamento por utilizador
-- com RLS. A integridade entre linhas é garantida na base de dados, não na
-- interface.

-- 1. Tipos ---------------------------------------------------------------

create type public.account_type as enum
  ('cash', 'current', 'savings', 'credit_card', 'loan');

create type public.category_type as enum ('income', 'expense');

create type public.transaction_kind as enum ('income', 'expense', 'transfer');

-- 2. Contas ----------------------------------------------------------------

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  type public.account_type not null,
  currency_code text not null check (char_length(currency_code) = 3),
  opening_balance_minor bigint not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Alvo das chaves compostas: garante que quem referencia esta conta
  -- pertence ao mesmo utilizador.
  unique (id, user_id)
);

comment on table public.accounts is
  'Contas financeiras. O saldo actual é opening_balance_minor + soma das transacções; nunca é persistido.';

-- Nome único por utilizador entre contas activas (arquivar liberta o nome).
create unique index accounts_user_name_active_key
  on public.accounts (user_id, name)
  where archived_at is null;

create index accounts_user_id_idx on public.accounts (user_id);

create trigger accounts_set_updated_at
  before update on public.accounts
  for each row
  execute function public.set_updated_at();

-- 3. Categorias --------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  type public.category_type not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

comment on table public.categories is
  'Categorias pessoais, separadas por receita/despesa, sem hierarquia no MVP (D-005).';

-- Único por utilizador e tipo, sem distinguir maiúsculas (DATABASE.md),
-- entre categorias activas.
create unique index categories_user_type_name_active_key
  on public.categories (user_id, type, lower(name))
  where archived_at is null;

create index categories_user_type_idx on public.categories (user_id, type);

create trigger categories_set_updated_at
  before update on public.categories
  for each row
  execute function public.set_updated_at();

-- 4. Transacções -------------------------------------------------------------

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null,
  kind public.transaction_kind not null,
  amount_minor bigint not null check (amount_minor <> 0),
  currency_code text not null check (char_length(currency_code) = 3),
  occurred_on date not null,
  description text,
  category_id uuid,
  transfer_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Chaves compostas: a conta e a categoria têm de pertencer ao MESMO
  -- utilizador da transacção. RLS isola utilizadores; isto isola relações.
  foreign key (account_id, user_id)
    references public.accounts (id, user_id),
  foreign key (category_id, user_id)
    references public.categories (id, user_id),

  -- D-003: sinal por tipo; transferências sem categoria e com transfer_id;
  -- receitas/despesas nunca têm transfer_id.
  constraint transactions_kind_shape_check check (
    (kind = 'income' and amount_minor > 0 and transfer_id is null)
    or (kind = 'expense' and amount_minor < 0 and transfer_id is null)
    or (kind = 'transfer' and category_id is null and transfer_id is not null)
  )
);

comment on table public.transactions is
  'Movimentos assinados por conta (D-003). Transferências são pares atómicos ligados por transfer_id.';

create index transactions_user_occurred_idx
  on public.transactions (user_id, occurred_on desc);

create index transactions_account_occurred_idx
  on public.transactions (account_id, occurred_on desc);

create index transactions_transfer_id_idx
  on public.transactions (transfer_id)
  where transfer_id is not null;

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row
  execute function public.set_updated_at();

-- 4.1 Regras que exigem consultar outras linhas (trigger de validação).
-- SECURITY INVOKER (predefinição): corre como o utilizador autenticado e a
-- RLS continua a aplicar-se às consultas feitas aqui dentro.

create or replace function public.validate_transaction()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_account public.accounts%rowtype;
  v_category_type public.category_type;
begin
  select * into v_account
  from public.accounts a
  where a.id = new.account_id and a.user_id = new.user_id;

  if not found then
    raise exception 'Conta inexistente ou de outro utilizador.';
  end if;

  if new.currency_code <> v_account.currency_code then
    raise exception 'A moeda da transacção tem de ser igual à moeda da conta.';
  end if;

  -- Contas arquivadas não aceitam movimentos novos nem recebem movimentos
  -- movidos de outra conta; editar movimentos históricos continua possível.
  if (tg_op = 'INSERT' or new.account_id is distinct from old.account_id)
     and v_account.archived_at is not null then
    raise exception 'Não é possível registar transacções numa conta arquivada.';
  end if;

  if new.category_id is not null then
    select c.type into v_category_type
    from public.categories c
    where c.id = new.category_id and c.user_id = new.user_id;

    if not found then
      raise exception 'Categoria inexistente ou de outro utilizador.';
    end if;

    if new.kind::text <> v_category_type::text then
      raise exception 'A categoria tem de ser do mesmo tipo que a transacção.';
    end if;
  end if;

  return new;
end;
$$;

create trigger transactions_validate
  before insert or update on public.transactions
  for each row
  execute function public.validate_transaction();

-- 5. Transferências atómicas -------------------------------------------------
-- D-003: uma transferência é criada/eliminada como operação atómica de dois
-- movimentos. SECURITY INVOKER mantém a RLS activa para quem chama; a função
-- corre numa única transacção por natureza.

create or replace function public.create_transfer(
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount_minor bigint,
  p_occurred_on date,
  p_description text default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_from public.accounts%rowtype;
  v_to public.accounts%rowtype;
  v_transfer_id uuid := gen_random_uuid();
begin
  if v_user_id is null then
    raise exception 'Sessão inválida.';
  end if;

  if p_amount_minor is null or p_amount_minor <= 0 then
    raise exception 'O montante da transferência tem de ser positivo.';
  end if;

  if p_from_account_id = p_to_account_id then
    raise exception 'A conta de origem e a de destino têm de ser diferentes.';
  end if;

  select * into v_from
  from public.accounts
  where id = p_from_account_id and user_id = v_user_id;

  if not found then
    raise exception 'Conta de origem inexistente.';
  end if;

  select * into v_to
  from public.accounts
  where id = p_to_account_id and user_id = v_user_id;

  if not found then
    raise exception 'Conta de destino inexistente.';
  end if;

  if v_from.currency_code <> v_to.currency_code then
    raise exception 'As duas contas têm de ter a mesma moeda no MVP.';
  end if;

  insert into public.transactions
    (user_id, account_id, kind, amount_minor, currency_code,
     occurred_on, description, transfer_id)
  values
    (v_user_id, p_from_account_id, 'transfer', -p_amount_minor,
     v_from.currency_code, p_occurred_on, p_description, v_transfer_id),
    (v_user_id, p_to_account_id, 'transfer', p_amount_minor,
     v_to.currency_code, p_occurred_on, p_description, v_transfer_id);

  return v_transfer_id;
end;
$$;

create or replace function public.delete_transfer(p_transfer_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  delete from public.transactions
  where transfer_id = p_transfer_id
    and user_id = auth.uid();

  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    raise exception 'Transferência inexistente.';
  end if;
end;
$$;

-- 6. Row Level Security --------------------------------------------------------

alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

-- Contas: sem política de DELETE — o produto arquiva, não apaga (D-004).
create policy "accounts_select_own" on public.accounts
  for select to authenticated using (auth.uid() = user_id);
create policy "accounts_insert_own" on public.accounts
  for insert to authenticated with check (auth.uid() = user_id);
create policy "accounts_update_own" on public.accounts
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Categorias: sem política de DELETE — arquivam-se (D-005).
create policy "categories_select_own" on public.categories
  for select to authenticated using (auth.uid() = user_id);
create policy "categories_insert_own" on public.categories
  for insert to authenticated with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Transacções: podem ser eliminadas (PRODUCT.md).
create policy "transactions_select_own" on public.transactions
  for select to authenticated using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "transactions_update_own" on public.transactions
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_delete_own" on public.transactions
  for delete to authenticated using (auth.uid() = user_id);
