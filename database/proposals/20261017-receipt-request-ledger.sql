-- AIHXO · Migración de prueba, NO APLICAR EN PRODUCCIÓN
-- Primer componente ejecutable de la recepción idempotente.
-- Esta migración crea el registro de solicitudes y su política de acceso.
-- NO modifica receive_stock_batch ni mueve existencias.
begin;

create table if not exists public.stock_receipt_requests (
  request_id uuid primary key,
  actor_id uuid not null,
  purchase_id uuid null references public.purchases(id),
  payload_hash text not null,
  result jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint receipt_result_complete check (
    (completed_at is null and result is null)
    or (completed_at is not null and result is not null)
  )
);

alter table public.stock_receipt_requests enable row level security;
revoke all on public.stock_receipt_requests from public, anon, authenticated;
grant select on public.stock_receipt_requests to authenticated;
grant all on public.stock_receipt_requests to service_role;

drop policy if exists stock_receipt_requests_team_select on public.stock_receipt_requests;
create policy stock_receipt_requests_team_select
on public.stock_receipt_requests for select to authenticated
using (
  actor_id=auth.uid()
  and lower(coalesce(auth.jwt()->>'email','')) in (
    'aihxo.camisetas@gmail.com',
    'gracielaoliveros.go@gmail.com'
  )
);

-- La futura RPC SECURITY INVOKER necesitará permisos controlados
-- para INSERT/UPDATE, o un wrapper SECURITY DEFINER con comprobación
-- explícita de identidad. Por ahora no se conceden: nadie puede crear
-- solicitudes desde el navegador.
commit;
