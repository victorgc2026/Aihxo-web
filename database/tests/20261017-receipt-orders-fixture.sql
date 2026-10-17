-- Simulación aislada de recepción + asignación a pedidos en una transacción.
-- No se ejecuta contra tablas de AIHXO en producción.
create table receipt_test.orders (
  id uuid primary key,
  item_id uuid not null,
  needed bigint not null check(needed>0),
  status text not null,
  allocated boolean not null default false
);
create table receipt_test.movements (
  id bigint generated always as identity primary key,
  request_id uuid not null,
  item_id uuid not null,
  delta bigint not null,
  reason text not null
);
create or replace function receipt_test.receive_with_orders(
  p_request_id uuid,p_items jsonb,p_purchase_id uuid default null
) returns jsonb language plpgsql as $$
declare
  v_canonical jsonb;
  v_existing record;
  v_line jsonb;
  v_item uuid;
  v_qty bigint;
  v_available bigint;
  v_order record;
  v_allocated int:=0;
  v_lines int:=0;
  v_result jsonb;
begin
  if p_request_id is null then raise exception 'Solicitud sin identificador'; end if;
  v_canonical:=public.canonical_stock_receipt(p_items,p_purchase_id);
  insert into receipt_test.requests(request_id,payload,result)
    values(p_request_id,v_canonical,'{}'::jsonb)
    on conflict(request_id) do nothing;
  select payload,result into v_existing from receipt_test.requests
    where request_id=p_request_id for update;
  if v_existing.payload is distinct from v_canonical then
    raise exception 'Conflicto de recepción: mismo UUID, distinto contenido';
  end if;
  if v_existing.result<>'{}'::jsonb then
    return jsonb_build_object('replayed',true,'result',v_existing.result);
  end if;
  for v_line in select value from jsonb_array_elements(v_canonical->'items') t(value)
  loop
    v_item:=(v_line->>'item_id')::uuid;
    v_qty:=(v_line->>'qty')::bigint;
    insert into receipt_test.stock(item_id,quantity) values(v_item,v_qty)
      on conflict(item_id) do update
      set quantity=receipt_test.stock.quantity+excluded.quantity
      returning quantity into v_available;
    insert into receipt_test.movements(request_id,item_id,delta,reason)
      values(p_request_id,v_item,v_qty,'entrada');
    for v_order in
      select id,needed from receipt_test.orders
      where item_id=v_item and allocated=false
        and lower(status) not in ('cancelado','entregado')
      order by id for update
    loop
      exit when v_available<v_order.needed;
      v_available:=v_available-v_order.needed;
      update receipt_test.stock set quantity=v_available where item_id=v_item;
      insert into receipt_test.movements(request_id,item_id,delta,reason)
        values(p_request_id,v_item,-v_order.needed,'asignacion');
      update receipt_test.orders set allocated=true where id=v_order.id;
      v_allocated:=v_allocated+1;
    end loop;
    v_lines:=v_lines+1;
  end loop;
  v_result:=jsonb_build_object('received_lines',v_lines,'orders_allocated',v_allocated);
  update receipt_test.requests set result=v_result where request_id=p_request_id;
  return jsonb_build_object('replayed',false,'result',v_result);
end;
$$;
