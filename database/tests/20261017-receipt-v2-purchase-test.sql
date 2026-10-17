-- Test aislado de la interfaz V2 vinculada a compras.
do $$
declare
 purchase uuid:='e1111111-1111-4111-8111-111111111111';
 item uuid:='e2222222-2222-4222-8222-222222222222';
 req uuid:='e3333333-3333-4333-8333-333333333333';
 items jsonb;
 result jsonb;
 n bigint;
begin
 insert into receipt_test.purchases(id) values(purchase);
 insert into receipt_test.purchase_lines(purchase_id,item_id,ordered_quantity)
 values(purchase,item,5);
 items:=jsonb_build_array(jsonb_build_object('item_id',item,'qty',2));
 result:=receipt_test.receive_stock_batch_v2(req,items,purchase);
 if result->>'replayed'<>'false' then raise exception 'Primera compra V2 no aplicada'; end if;
 if (select status from receipt_test.purchases where id=purchase)<>'Parcial' then
  raise exception 'Estado parcial de compra V2 incorrecto'; end if;
 result:=receipt_test.receive_stock_batch_v2(req,items,purchase);
 if result->>'replayed'<>'true' then raise exception 'Compra V2 no detecta repetición'; end if;
 select received_quantity into n from receipt_test.purchase_lines
 where purchase_id=purchase and item_id=item;
 if n<>2 then raise exception 'Compra V2 duplicó cantidades: %',n; end if;
 select count(*) into n from receipt_test.movements
 where request_id=req and reason='entrada compra';
 if n<>1 then raise exception 'Compra V2 duplicó movimientos: %',n; end if;
 raise notice 'PASS: V2 purchase delegates to idempotent partial purchase receipt';
end $$;
