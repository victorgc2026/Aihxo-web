do $$
declare
  item uuid:='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  req uuid:='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  payload jsonb;
  first_result jsonb;
  replay_result jsonb;
  n bigint;
begin
  insert into receipt_test.orders(id,item_id,needed,status) values
    ('00000000-0000-4000-8000-000000000001',item,2,'Pendiente'),
    ('00000000-0000-4000-8000-000000000002',item,2,'Cancelado'),
    ('00000000-0000-4000-8000-000000000003',item,1,'Entregado'),
    ('00000000-0000-4000-8000-000000000004',item,2,'Pendiente');
  payload:=jsonb_build_array(jsonb_build_object('item_id',item,'qty',5));
  first_result:=receipt_test.receive_with_orders(req,payload);
  replay_result:=receipt_test.receive_with_orders(req,payload);
  if first_result->>'replayed'<>'false' or replay_result->>'replayed'<>'true' then
    raise exception 'La recepción repetida no fue detectada';
  end if;
  if (first_result->'result'->>'orders_allocated')::int<>2 then
    raise exception 'Asignación incorrecta';
  end if;
  select quantity into n from receipt_test.stock where item_id=item;
  if n<>1 then raise exception 'Stock esperado 1, real %',n; end if;
  select count(*) into n from receipt_test.orders where allocated=true;
  if n<>2 then raise exception 'Se asignaron pedidos cancelados o entregados'; end if;
  select count(*) into n from receipt_test.movements where request_id=req;
  if n<>3 then raise exception 'Se duplicaron movimientos'; end if;
  raise notice 'PASS: one receipt, two valid allocations, no duplicate movement';
end $$;
