-- Migração 0007 — Regras de categorização (V2 Sprint 6, D-011)
--
-- Regras pessoais e determinísticas que atribuem uma categoria a movimentos
-- sem categoria, a partir da descrição. A aplicação das regras é feita na
-- camada de aplicação (TypeScript, testável); esta tabela é a fonte das
-- regras, isolada por utilizador com RLS.

create table public.categorization_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pattern text not null check (btrim(pattern) <> ''),
  match_type text not null default 'contains'
    check (match_type in ('contains', 'starts_with', 'equals')),
  category_id uuid not null,
  -- Menor valor = maior prioridade; a primeira regra que casa vence.
  priority integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Chave composta: a categoria da regra pertence ao mesmo utilizador.
  foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete cascade
);

comment on table public.categorization_rules is
  'Regras determinísticas de categorização por descrição (D-011). Só preenchem movimentos sem categoria; nunca sobrepõem escolhas manuais.';

create index categorization_rules_user_priority_idx
  on public.categorization_rules (user_id, priority);

create trigger categorization_rules_set_updated_at
  before update on public.categorization_rules
  for each row
  execute function public.set_updated_at();

alter table public.categorization_rules enable row level security;

create policy "categorization_rules_select_own" on public.categorization_rules
  for select to authenticated using (auth.uid() = user_id);
create policy "categorization_rules_insert_own" on public.categorization_rules
  for insert to authenticated with check (auth.uid() = user_id);
create policy "categorization_rules_update_own" on public.categorization_rules
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categorization_rules_delete_own" on public.categorization_rules
  for delete to authenticated using (auth.uid() = user_id);
