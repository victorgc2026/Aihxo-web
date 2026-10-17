-- AIHXO: demostración AISLADA de idempotencia transaccional.
-- No utiliza tablas reales de stock ni se instala en Supabase.
create schema if not exists receipt_test;
create table receipt_test.requests (
  request_id uuid primary key,
  payload jsonb not null,
  result jsonb not null
);
create table receipt_test.stock (
  item_id uuid primary key,
  quantity bigint not null default 0
);
create or replace function receipt_test.receive_once(
  p_request_id uuid, p_items jsonb, p_purchase_id uuid default null
) returns jsonb language plpgsql as $$
declare
  v_payload jsonb;
  v_result jsonb;
  v_line jsonb;
  v_count integer;
begin
  if p_request_id is null then raise exception 'Solicitud sin identificador'; end if;
  v_payload := public.canonical_stock_receipt(p_items,p_purchase_id);
  -- El registro único serializa peticiones concurrentes con el mismo UUID.
  insert into receipt_test.requests(request_id,payload,result)
    values (p_request_id,v_payload,'{}'::jsonb)
    on conflict (request_id) do nothing;
  select payload,result into v_result,v_payload
    from receipt_test.requests where request_id=p_request_id for update;
  -- Variables anteriores reutilizadas intencionadamente; comprobar contrato.
  if v_result is distinct from public.canonical_stock_receipt(p_items,p_purchase_id) then
    raise exception 'Conflicto de recepción: mismo UUID, distinto contenido';
  end if;
  if v_payload <> '{}'::jsonb then
    return jsonb_build_object('replayed',true,'result',v_payload);
  end if;
  for v_line in select value from jsonb_array_elements(v_result->'items') t(value)
  loop
    insert into receipt_test.stock(item_id,quantity)
      values ((v_line->>'item_id')::uuid,(v_line->>'qty')::bigint)
      on conflict (item_id) do update
        set quantity=receipt_test.stock.quantity+excluded.quantity;
  end loop;
  select count(*) into v_count from jsonb_array_elements(v_result->'items');
  v_payload:=jsonb_build_object('received_lines',v_count);
  update receipt_test.requests set result=v_payload where request_id=p_request_id;
  return jsonb_build_object('replayed',false,'result',v_payload);
end;
$$;
