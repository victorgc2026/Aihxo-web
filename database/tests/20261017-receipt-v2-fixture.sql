-- Prototipo ejecutable únicamente para la base aislada de CI.
-- No desplegar: receipt_test no es el esquema real de AIHXO.
-- Contrato versionado: mismo request_id y contenido => mismo resultado, sin repetir efectos.
create or replace function receipt_test.receive_stock_batch_v2(
 p_request_id uuid,
 p_items jsonb,
 p_purchase_id uuid default null
) returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public, receipt_test
as $$
declare
 canonical jsonb;
 prior record;
 v_result jsonb;
begin
 if p_request_id is null then
  raise exception 'Falta identificador único de recepción';
 end if;
 canonical:=public.canonical_stock_receipt(p_items,p_purchase_id);
 if p_purchase_id is not null then
  -- La simulación de compras comprueba cantidades y actualiza su estado.
  return receipt_test.receive_purchase(p_request_id,p_purchase_id,p_items);
 end if;
 -- Simulación de recepción sin compra, sin asignaciones automáticas.
 insert into receipt_test.requests(request_id,payload,result)
 values(p_request_id,canonical,'{}'::jsonb)
 on conflict(request_id) do nothing;
 select r.payload,r.result into prior from receipt_test.requests r
 where r.request_id=p_request_id for update;
 if prior.payload is distinct from canonical then
  raise exception 'Conflicto de recepción: solicitud ya utilizada con otro contenido';
 end if;
 if prior.result<>'{}'::jsonb then
  return jsonb_build_object('replayed',true,'result',prior.result);
 end if;
 with lines as (
  select (x->>'item_id')::uuid as item_id,(x->>'qty')::bigint as qty
  from jsonb_array_elements(canonical->'items') x
 ), added as (
  insert into receipt_test.stock(item_id,quantity)
  select item_id,qty from lines
  on conflict(item_id) do update
   set quantity=receipt_test.stock.quantity+excluded.quantity
  returning item_id
 )
 select jsonb_build_object('lines',count(*)) into v_result from added;
 insert into receipt_test.movements(request_id,item_id,delta,reason)
 select p_request_id,(x->>'item_id')::uuid,(x->>'qty')::bigint,'entrada v2'
 from jsonb_array_elements(canonical->'items') x;
 update receipt_test.requests set result=v_result where request_id=p_request_id;
 return jsonb_build_object('replayed',false,'result',v_result);
end;
$$;
revoke all on function receipt_test.receive_stock_batch_v2(uuid,jsonb,uuid)
 from public, anon, authenticated;
