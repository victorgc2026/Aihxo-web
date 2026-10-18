# AIHXO Guardian · RPC exposure audit (2026-10-18)

**Source:** read-only inspection of PostgreSQL catalog metadata and function definitions in the current Supabase project. No RPC was executed and no stock was changed.

## Confirmed high-priority finding
- `public.begin_inventory_reset(text)` and `public.finish_inventory_cycle(uuid)` have EXECUTE grants for `PUBLIC` and `anon`, as well as `authenticated`, `postgres` and `service_role`.
- Both functions run as **SECURITY INVOKER**. The grant **does not establish that anonymous callers can successfully change stock**, because table permissions and RLS also apply. Nevertheless the functions are unnecessarily exposed at the EXECUTE layer.
- `begin_inventory_reset` creates an inventory cycle, logs stock movements and sets stock quantities to zero when authorized. It is high-impact and must never be tested on production by invoking it.
- `finish_inventory_cycle` marks an active cycle finished when authorized.
- `receive_stock_batch`, `create_order_atomic` and `record_order_payment` do **not** grant EXECUTE to `PUBLIC` or `anon` in the inspected catalog.
- `record_stock_movement` is SECURITY DEFINER and is only granted to `postgres` and `service_role` in the inspected catalog.

## Proposed mitigation (NOT APPLIED)
A reviewed proposal already exists on the separate audit branch:
`database/proposals/20261017-restrict-inventory-rpc.sql`.
It revokes EXECUTE for `PUBLIC` and `anon` on the two inventory-cycle functions while preserving the explicitly granted authenticated and service roles.

## Release gate
1. Review every frontend caller of these functions.
2. Confirm that legitimate users are authenticated before use.
3. Test the proposed grants in disposable PostgreSQL and staging Supabase.
4. Obtain explicit authorization before changing production grants.

**Status:** verified exposure; remediation proposed but not deployed.
