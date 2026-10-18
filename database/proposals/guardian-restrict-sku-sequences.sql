-- AIHXO Guardian: proposal only, NEVER auto-apply to production.
-- Prevent anonymous consumption of SKU sequences via public.aihxo_next_sku.
-- IMPORTANT: revoke from PUBLIC removes implicit EXECUTE/USAGE inherited by
-- authenticated too; explicit grants below preserve legitimate app workflows.
-- Review trigger functions, client paths and sequence ownership before applying.
begin;
revoke execute on function public.aihxo_next_sku(text) from PUBLIC, anon;
grant execute on function public.aihxo_next_sku(text) to authenticated, service_role;
revoke usage on sequence public.aihxo_sku_base_seq from PUBLIC, anon;
revoke usage on sequence public.aihxo_sku_design_seq from PUBLIC, anon;
grant usage on sequence public.aihxo_sku_base_seq to authenticated, service_role;
grant usage on sequence public.aihxo_sku_design_seq to authenticated, service_role;
commit;
