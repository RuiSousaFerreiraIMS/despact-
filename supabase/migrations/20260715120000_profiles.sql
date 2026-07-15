-- Migração 0001 — Identidade e perfil de utilizador (Sprint 1)
--
-- Cria a tabela `profiles` como extensão de `auth.users`, com Row Level
-- Security, políticas por utilizador e criação automática de perfil no
-- registo. NÃO cria tabelas financeiras: essas pertencem ao Sprint 2.

-- 1. Tabela de perfis --------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  preferred_currency_code text not null default 'EUR'
    check (char_length(preferred_currency_code) = 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Dados de produto por utilizador (uma linha por auth.users). Nunca guarda credenciais nem dados de sessão.';

-- 2. Manutenção automática de updated_at ------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- 3. Row Level Security ------------------------------------------------------
-- RLS é a última barreira de isolamento entre utilizadores (ver ARCHITECTURE.md).

alter table public.profiles enable row level security;

-- Cada utilizador só lê o seu próprio perfil.
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Cada utilizador só cria o seu próprio perfil (upsert defensivo; o caminho
-- normal de criação é o trigger da secção 4).
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Cada utilizador só actualiza o seu próprio perfil.
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Sem política de DELETE: a aplicação não apaga perfis. A remoção do
-- utilizador em auth.users propaga-se via ON DELETE CASCADE.

-- 4. Criação automática de perfil ao registar utilizador ---------------------
-- SECURITY DEFINER corre com privilégios do dono da função e, portanto,
-- consegue inserir apesar da RLS. `search_path = ''` obriga a qualificar todos
-- os nomes de objectos, prevenindo ataques de resolução de nomes.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'display_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
