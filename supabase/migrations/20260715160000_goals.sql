-- Migração 0004 — Objectivos (Sprint 3)
--
-- Objectivos têm progresso manual (D-006): não reservam dinheiro em contas,
-- não movem saldos e não afectam o património. O estado `completed` é
-- explícito no modelo; a interface pode sugeri-lo quando o progresso atinge
-- o alvo.

create type public.goal_status as enum ('active', 'completed', 'archived');

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  target_amount_minor bigint not null check (target_amount_minor > 0),
  current_amount_minor bigint not null default 0
    check (current_amount_minor >= 0),
  currency_code text not null check (char_length(currency_code) = 3),
  target_date date,
  status public.goal_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.goals is
  'Objectivos com progresso manual (D-006). Não reservam dinheiro nem alteram o património.';

create index goals_user_status_idx on public.goals (user_id, status);

create trigger goals_set_updated_at
  before update on public.goals
  for each row
  execute function public.set_updated_at();

alter table public.goals enable row level security;

-- Sem política de DELETE: objectivos arquivam-se através do estado.
create policy "goals_select_own" on public.goals
  for select to authenticated using (auth.uid() = user_id);
create policy "goals_insert_own" on public.goals
  for insert to authenticated with check (auth.uid() = user_id);
create policy "goals_update_own" on public.goals
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
