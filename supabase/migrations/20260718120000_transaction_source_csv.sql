-- Migração 0008 — Proveniência CSV (V2 Sprint 6, Unidade B)
--
-- Acrescenta o valor 'csv' ao enum de proveniência dos movimentos, para
-- distinguir importações de extracto das entradas manuais e bancárias.
-- O novo valor não é usado nesta migração (só em código posterior), pelo
-- que a adição é segura mesmo dentro de uma transacção.

alter type public.transaction_source add value if not exists 'csv';
