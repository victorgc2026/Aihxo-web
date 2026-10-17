-- AIHXO: prevent anonymous execution of inventory-cycle RPCs.
-- PROPOSAL ONLY: do not apply before reviewing client compatibility.
-- Both functions currently execute with invoker privileges and their tables
-- already have RLS restricted to the two AIHXO team email identities.
begin;
revoke execute on function public.begin_inventory_reset(text) from public, anon;
revoke execute on function public.finish_inventory_cycle(uuid) from public, anon;
-- Existing authenticated and service_role grants are preserved.
-- This change does not start a cycle or modify inventory quantities.
commit;
