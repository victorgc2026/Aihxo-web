# AIHXO Guardian · Global database access inventory (2026-10-18)

This is a **read-only catalog inspection**, not a penetration test.

- All **57** ordinary/partitioned tables in the `public` schema have row-level security enabled; **0** have RLS disabled.
- Two public views were found: `erp_item_master` and `marketing_campaign_performance`.
- Both views have `security_invoker=true`, so their queries execute with the invoking role's privileges instead of the view owner's privileges.
- Both views grant SELECT to `anon` and `authenticated`. This alone does not prove anonymous users can read rows: underlying table grants and RLS still apply. Review whether anonymous SELECT is intended and test with non-admin credentials.
- This inspection does **not** cover storage object policies, RPC authorization beyond the separately documented inventory audit, edge functions, schema outside `public`, or real-user authorization outcomes.

## Release requirements
1. Verify that anonymous SELECT on both views is intentional and returns only intended data.
2. Exercise positive and negative tests with real Supabase roles in an isolated project.
3. Inventory exposed RPCs and storage buckets, including SECURITY DEFINER functions.
4. Validate actual backup restore and incident notifications before declaring Guardian complete.

**No production mutations were performed.**
