-- AIHXO · BORRADOR PARA ENTORNO AISLADO. NO DESPLEGAR EN PRODUCCIÓN.
-- Depende de 20261017-receipt-request-ledger.sql.
-- Esta RPC SOLO gestiona solicitudes; NO recibe stock.
-- Debe integrarse con el procesamiento de stock en UNA MISMA función/transacción.
create or replace function public.claim_stock_receipt_request(
  p_request_id uuid,
  p_payload_hash text,
  p_purchase_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_existing public.stock_receipt_requests%rowtype;
begin
  if v_actor is null or lower(coalesce(auth.jwt()->>'email','')) not in (
    'aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com'
  ) then
    raise exception 'No autorizado';
  end if;
  if p_request_id is null or p_payload_hash is null or length(p_payload_hash)<>64
    or p_payload_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Identificador o huella inválidos';
  end if;

  insert into public.stock_receipt_requests
    (request_id,actor_id,purchase_id,payload_hash)
  values (p_request_id,v_actor,p_purchase_id,p_payload_hash)
  on conflict (request_id) do nothing;

  select * into v_existing from public.stock_receipt_requests
  where request_id=p_request_id for update;
  if not found then raise exception 'Solicitud inaccesible'; end if;
  if v_existing.actor_id<>v_actor
    or v_existing.payload_hash<>p_payload_hash
    or v_existing.purchase_id is distinct from p_purchase_id then
    raise exception 'Conflicto de recepción: identificador reutilizado';
  end if;
  if v_existing.completed_at is not null then
    return jsonb_build_object('state','completed','replayed',true,'result',v_existing.result);
  end if;
  return jsonb_build_object('state','claimed','replayed',false);
end;
$$;

-- PRECAUCIÓN: esta función SECURITY INVOKER requiere INSERT/SELECT sobre el
-- registro para operar, y la migración de ledger solo concede SELECT.
-- NO otorgar permisos de INSERT desde el navegador ni exponer la función
-- hasta integrarla en una RPC transaccional completa y auditar RLS.
revoke all on function public.claim_stock_receipt_request(uuid,text,uuid) from public, anon, authenticated;
