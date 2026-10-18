# AIHXO Guardian · Supabase Storage audit (2026-10-18)

Read-only metadata inspection; **no files opened, uploaded, changed or deleted**.

## Buckets (7)
| Bucket | Public bucket | Objects observed | Access notes |
|---|---|---:|---|
| design-library | No | 8 | SELECT/INSERT/DELETE authenticated, restricted to a folder matching `auth.uid()` |
| expense-receipts | No | 5 | Team-email restricted CRUD policies |
| memory-files | No | 0 | Team-email restricted ALL policy |
| mockup-templates | Yes | 9 | Public SELECT policy; writes restricted to team |
| order-designs | No | 16 | Team-email restricted CRUD policies |
| product-images | Yes | 65 | Team-email restricted writes and SELECT policy; public bucket means public object URLs can be read independently of SELECT RLS |
| purchase-invoices | No | 7 | Team-email restricted SELECT/INSERT/DELETE |

**23 storage.objects RLS policies** were inspected. Public visibility for `product-images` and `mockup-templates` appears consistent with public storefront imagery; nevertheless review file contents for accidental personal/client artwork. A public bucket exposes objects by known public URLs, regardless of private-looking SELECT policy.

## Review points
1. Confirm `product-images` contains only publishable storefront assets, never confidential customer images.
2. Confirm `mockup-templates` images are licensed and intended for public distribution.
3. Confirm upload/overwrite/delete behavior with a non-admin account in a disposable environment.
4. Confirm private bucket signed URLs are short-lived and not stored in public HTML or logs.
5. Check whether `design-library` intentionally permits any authenticated user to create an isolated folder, rather than only designated AIHXO staff.

## Limitations
Storage bucket public flags, policies and object counts were read from catalog tables. No real anonymous HTTP requests or private URL access attempts were made. No backup or restore has been validated.

**Status: storage inventory complete; effective access tests pending.**
