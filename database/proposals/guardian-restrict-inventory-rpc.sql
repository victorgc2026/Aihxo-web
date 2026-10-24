-- AIHXO Guardian: inventory reset EXECUTE grants (proposal only).
-- The frontend calls both RPCs from gestion/inventario-reset.js after user confirmation.
-- Both functions run as SECURITY INVOKER; existing table RLS remains in effect.
-- This migration is NOT applied by committing it. Run only after staging tests and approval.
begin;
revoke execute on function public.begin_inventory_reset(text) from PUBLIC, anon;
revoke execute on function public.finish_inventory_cycle(uuid) from PUBLIC, anon;
-- Keep the explicitly granted authenticated and service_role access.
commit;
