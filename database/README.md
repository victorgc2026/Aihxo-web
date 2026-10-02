# Gestión: mejora operativa 2026-10-02

`gestion-improvements.sql` is the additive migration applied to the connected Supabase project before publishing the frontend. All new RPCs use SECURITY INVOKER and authenticated-only execution; existing team RLS remains authoritative. The stock policies now use the same two-account allowlist as orders.

Orders created by the new main form store variant snapshots in `orders.order_lines`. Single-variant orders preserve `base_stock_item_id` for older screens. Multi-variant orders set it to NULL; allocation and production use each line's `allocated` flag. Print placement metadata and storage paths are in `print_zones`. Estimated total costs are separate from actual costs.

An order's UUID is its retry key. The RPC locks the server-side number calculation and stock rows; orders, customers, reservations and movement history commit or roll back together. The caller should reuse the UUID on a network retry. Image uploads run after the order commits and can be retried without repeating the order.

Payments are append-only movements, including negative refunds. When recording the first movement for an older paid order, the previous aggregate is preserved as a clearly labelled historical balance. Do not overwrite payment aggregates from old UI forms. Order deletion is restricted when payment history exists.

Receiving a purchase checks remaining quantities while holding a lock, so repeating a receipt cannot add the same units again. The prior function is preserved in `receive-stock-before.sql` as review/rollback reference, not as a migration to apply.

Validation: run the migration followed by `tests/database-rollback.sql` inside BEGIN/ROLLBACK to exercise RLS as Graci, multi-line allocation, retry safety, catalog stock, payments/refunds and full rollback. No fixtures are persisted. `tests/ui-smoke.cjs` exercises the main form with mocked API at mobile width. Set AIHXO_TEST_CHROMIUM if the environment needs a specific Chromium path.

Remaining architectural work: historical modules still wrap navigation and some detail screens. This release replaces the active main order form and removes its global insert interceptor, but does not claim to consolidate the entire application. The separate historical “Pedidos personalizados” module remains unchanged. A single version token now invalidates frontend assets on release rather than on each page load.
