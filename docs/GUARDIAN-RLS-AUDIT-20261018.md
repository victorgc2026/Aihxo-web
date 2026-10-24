# AIHXO Guardian · Read-only RLS audit (2026-10-18)

Source: live Supabase PostgreSQL catalog metadata inspected **without modifying data or schema**.

## Confirmed
- Row-level security is **enabled** on: `orders`, `customers`, `purchases`, `purchase_lines`, `base_stock_items`, `base_stock_movements`.
- Each of those tables has authenticated-role policies scoped to two designated AIHXO team emails.
- The policies for `orders`, `customers`, `purchase_lines` and `purchases` apply to all SQL commands; base stock items use separate read/insert/update/delete policies; movements have read and insert policies.
- `purchases` checks email without `lower()`, whereas the other audited tables normalize the JWT email to lowercase. This is a consistency issue to review; no change was applied.

## What this does NOT prove
- Whether every RPC, storage bucket and view enforces the intended permissions.
- Whether an unauthorized real user can read/write data through API routes.
- Whether backups, point-in-time recovery, or alert delivery are enabled.
- Whether a database restore has succeeded.

## Next checks
1. Inspect SECURITY DEFINER/INVOKER RPC grants and exposed views without writing to production.
2. Test unauthorized and authorized access against a disposable project or branch with fake accounts.
3. Confirm and rehearse backup restoration separately before marking Guardian complete.

**Status: PARTIAL. No production writes.**
