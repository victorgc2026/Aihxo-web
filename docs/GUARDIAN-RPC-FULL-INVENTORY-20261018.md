# AIHXO Guardian · Complete public RPC inventory (2026-10-18)

Read-only metadata and selected function-definition review; no production RPC invoked.

## Results
- Inspected **15** functions in `public`.
- **8** show `anon` EXECUTE: `aihxo_garment_sku_trigger`, `aihxo_next_sku`, `aihxo_product_sku_trigger`, `aihxo_user_authorized`, `assign_aihxo_internal_sku`, `begin_inventory_reset`, `finish_inventory_cycle`, `validate_coupon`.
- **7** do not show `anon` EXECUTE: `check_purchase_reference`, `create_order_atomic`, `next_aihxo_order_number`, `quick_order_garment`, `receive_stock_batch`, `record_order_payment`, `record_stock_movement`.
- `record_stock_movement` is SECURITY DEFINER, with no `anon` or `authenticated` EXECUTE in the catalog.
- `aihxo_next_sku(text)` is SECURITY INVOKER and advances a sequence via `nextval()`. **Anonymous USAGE on both `aihxo_sku_base_seq` and `aihxo_sku_design_seq` is confirmed.** Thus anonymous callers potentially can advance SKU numbering, even without creating a product. This needs a negative API test and a reviewed permission change.
- `validate_coupon` is SECURITY INVOKER and queries `coupons`, so underlying table permissions and RLS affect whether anonymous callers can validate coupons. Its intended public-shop behavior needs review.
- `aihxo_user_authorized` checks a JWT email against active authorized users; its anonymous EXECUTE is not in itself a data exposure.
- Three trigger functions have anonymous EXECUTE metadata; trigger functions generally cannot be called directly as normal RPCs. Their grants should still be reviewed.

## Proposed remediation (NOT APPLIED)
1. Restrict `aihxo_next_sku(text)` to authenticated/service roles if storefront and registration flows do not require anonymous SKU generation.
2. Review anonymous USAGE on both SKU sequences and revoke it if no anonymous workflow needs sequence access.
3. Keep `validate_coupon` available only to the roles required by the actual checkout implementation.
4. Restrict the two inventory-cycle RPCs as already staged in `database/proposals/guardian-restrict-inventory-rpc.sql`.
5. Test legitimate SKU generation and coupon checkout on a disposable environment before deploying.

**Risk qualification:** function privileges plus sequence USAGE show a credible unauthenticated sequence-increment route; this does not establish unauthorized stock or customer-data access. No live exploit attempt performed.
