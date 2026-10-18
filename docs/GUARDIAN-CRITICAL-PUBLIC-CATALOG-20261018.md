# AIHXO Guardian · Critical public catalog exposure (2026-10-18)

**Finding: high priority. Production was inspected with read-only SQL only.**

The `public.products` table currently has a permissive `anon` SELECT policy with `USING (true)`, and `anon` has table SELECT privilege. The table contains internal cost columns (`garment_cost`, `dtf_cost`, `extras_cost`, `purchase_cost`) and unpublished designs. Observed **40 total products**, **15 web_published=true**, **25 not published**, **40 with at least one populated internal cost field**.

**Consequence:** Row-level security does not restrict the columns returned. Under the current grants/policy, anonymous REST readers may query internal cost fields and unpublished product rows directly, regardless of what the storefront UI displays. This is a policy-level exposure, not proof that anyone accessed the information.

### Safe remediation design — requires separate testing
1. Create a public, allowlisted projection with only intended storefront fields, filtered by `web_published=true` and other business eligibility rules.
2. Migrate the website's catalog reads to that projection; check search, product pages, prices, campaign links, checkout and images.
3. Remove anonymous table SELECT from `public.products` **after** storefront migration, and ensure public view access works with underlying grants/RLS. A `security_invoker=true` view alone is not sufficient if anonymous SELECT on the base table is revoked; consider a carefully scoped SECURITY DEFINER RPC with fixed projection and explicit grants, or a controlled server-side API. Security design review required.
4. Test anonymous, unauthorized authenticated, and AIHXO team users on a disposable environment.
5. Inspect analogous `web_campaigns` and `web_promotions` policies, which also use anonymous `USING (true)`, for drafts or private fields.

### Important cautions
- Simply changing `USING (true)` to `web_published=true` would hide unpublished rows but **would still expose costs on published rows**.
- Simply revoking anonymous SELECT now could break the live storefront.
- No SQL remediation was applied; do not merge or deploy until approved and tested.
