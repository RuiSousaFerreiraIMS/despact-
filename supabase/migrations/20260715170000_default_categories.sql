-- Migração 0005 — Categorias sugeridas (Sprint 4, D-008)
--
-- Cada utilizador novo recebe um conjunto inicial de categorias comuns.
-- Continuam a ser categorias pessoais (D-005): editáveis, arquiváveis e
-- independentes por utilizador. Utilizadores existentes podem pedir o mesmo
-- conjunto através da própria função (idempotente).

create or replace function public.seed_default_categories(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Quando chamada por um utilizador autenticado, só pode semear as próprias
  -- categorias. No trigger de registo não há sessão (auth.uid() é null).
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'Só é possível criar categorias para o próprio utilizador.';
  end if;

  insert into public.categories (user_id, name, type)
  values
    (p_user_id, 'Supermercado', 'expense'),
    (p_user_id, 'Restaurantes e cafés', 'expense'),
    (p_user_id, 'Casa', 'expense'),
    (p_user_id, 'Transportes', 'expense'),
    (p_user_id, 'Saúde', 'expense'),
    (p_user_id, 'Lazer', 'expense'),
    (p_user_id, 'Subscrições', 'expense'),
    (p_user_id, 'Compras', 'expense'),
    (p_user_id, 'Salário', 'income'),
    (p_user_id, 'Outros rendimentos', 'income')
  on conflict (user_id, type, lower(name)) where (archived_at is null)
  do nothing;
end;
$$;

-- Novos utilizadores recebem as categorias no registo, junto com o perfil.
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

  perform public.seed_default_categories(new.id);

  return new;
end;
$$;
