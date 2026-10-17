-- AIHXO inventory RPC permissions: proposal, not applied.
-- Keep service_role and the two team users, restrict public/anon access.
begin;
revoke execute on function public.begin_inventory_reset(text) from public, anon;
revoke execute on function public.finish_inventory_cycle(uuid) from public, anon;
-- Authenticated calls remain subject to table RLS. Further user-specific
-- checks should be added before granting this RPC to any wider audience.
commit;
