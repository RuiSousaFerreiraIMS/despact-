-- Migração 0003 — View de saldos de conta (Sprint 2)
--
-- Concretiza D-002 na base de dados: o saldo actual é
-- opening_balance_minor + soma dos movimentos, calculado no momento e nunca
-- persistido. `security_invoker` faz a view correr com os privilégios de quem
-- consulta, mantendo a RLS das tabelas subjacentes.

create view public.account_balances
with (security_invoker = true) as
select
  a.id,
  a.user_id,
  a.name,
  a.type,
  a.currency_code,
  a.opening_balance_minor,
  a.archived_at,
  a.created_at,
  a.updated_at,
  a.opening_balance_minor + coalesce(sum(t.amount_minor), 0) as balance_minor
from public.accounts a
left join public.transactions t on t.account_id = a.id
group by a.id;

comment on view public.account_balances is
  'Contas com saldo derivado (D-002). Nunca persistir o saldo; esta view é a única fonte do valor actual.';
