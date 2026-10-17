-- Mock mínimo para probar los permisos del ledger en PostgreSQL desechable.
-- NO ejecutar en Supabase de producción.
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create or replace function auth.jwt() returns jsonb language sql stable as
$$ select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb) $$;
create table if not exists public.purchases(id uuid primary key);
