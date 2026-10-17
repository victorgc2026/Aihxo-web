-- Simulación aislada de recepción parcial de compras a proveedores.
create table receipt_test.purchase_lines (
 purchase_id uuid not null,
 item_id uuid not null,
 ordered_quantity bigint not null check(ordered_quantity>0),
 received_quantity bigint not null default 0 check(received_quantity>=0),
 primary key(purchase_id,item_id),
 check(received_quantity<=ordered_quantity)
);
create table receipt_test.purchases (
 id uuid primary key,
 status text not null default 'Pendiente'
);
create or replace function receipt_test.receive_purchase(
 p_request_id uuid,p_purchase_id uuid,p_items jsonb
) returns jsonb language plpgsql as $$
declare
 canonical jsonb;
 old_request record;
 line jsonb;
 item uuid;
 qty bigint;
 pending bigint;
 result jsonb;
 lines_count int:=0;
 total_count int;
 complete_count int;
begin
 if p_request_id is null or p_purchase_id is null then
  raise exception 'Identificadores requeridos';
 end if;
 canonical:=public.canonical_stock_receipt(p_items,p_purchase_id);
 perform 1 from receipt_test.purchases where id=p_purchase_id for update;
 if not found then raise exception 'Compra inexistente'; end if;
 insert into receipt_test.requests(request_id,payload,result)
 values(p_request_id,canonical,'{}'::jsonb)
 on conflict(request_id) do nothing;
 select payload,result into old_request from receipt_test.requests
 where request_id=p_request_id for update;
 if old_request.payload is distinct from canonical then
  raise exception 'Conflicto de recepción: mismo UUID, distinto contenido';
 end if;
 if old_request.result<>'{}'::jsonb then
  return jsonb_build_object('replayed',true,'result',old_request.result);
 end if;
 for line in select value from jsonb_array_elements(canonical->'items') t(value)
 loop
  item:=(line->>'item_id')::uuid;
  qty:=(line->>'qty')::bigint;
  select ordered_quantity-received_quantity into pending
  from receipt_test.purchase_lines
  where purchase_id=p_purchase_id and item_id=item for update;
  if not found then raise exception 'La prenda no pertenece a esta compra'; end if;
  if qty>pending then raise exception 'La recepción supera las unidades pendientes'; end if;
  update receipt_test.purchase_lines
    set received_quantity=received_quantity+qty
    where purchase_id=p_purchase_id and item_id=item;
  insert into receipt_test.stock(item_id,quantity) values(item,qty)
  on conflict(item_id) do update
  set quantity=receipt_test.stock.quantity+excluded.quantity;
  insert into receipt_test.movements(request_id,item_id,delta,reason)
  values(p_request_id,item,qty,'entrada compra');
  lines_count:=lines_count+1;
 end loop;
 select count(*),count(*) filter(where received_quantity=ordered_quantity)
 into total_count,complete_count
 from receipt_test.purchase_lines where purchase_id=p_purchase_id;
 update receipt_test.purchases set status=
  case when total_count>0 and total_count=complete_count then 'Recibido'
       when exists(select 1 from receipt_test.purchase_lines
                   where purchase_id=p_purchase_id and received_quantity>0) then 'Parcial'
       else status end
 where id=p_purchase_id;
 result:=jsonb_build_object('lines',lines_count,
  'purchase_status',(select status from receipt_test.purchases where id=p_purchase_id));
 update receipt_test.requests set result=result where request_id=p_request_id;
 return jsonb_build_object('replayed',false,'result',result);
end;
$$;
