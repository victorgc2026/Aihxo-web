-- El rechazo de una recepción no debe consumir su identificador.
do $$
declare
 p uuid:='b1111111-1111-4111-8111-111111111111';
 item uuid:='b2222222-2222-4222-8222-222222222222';
 req uuid:='b3333333-3333-4333-8333-333333333333';
 failed boolean:=false;
 n bigint;
begin
 insert into receipt_test.purchases(id) values(p);
 insert into receipt_test.purchase_lines(purchase_id,item_id,ordered_quantity)
 values(p,item,3);
 begin
  perform receipt_test.receive_purchase(req,p,
   jsonb_build_array(jsonb_build_object('item_id',item,'qty',4)));
 exception when others then failed:=true; end;
 if not failed then raise exception 'Se admitió recepción superior a lo pedido'; end if;
 if exists(select 1 from receipt_test.requests where request_id=req) then
  raise exception 'Identificador consumido por operación fallida'; end if;
 perform receipt_test.receive_purchase(req,p,
  jsonb_build_array(jsonb_build_object('item_id',item,'qty',3)));
 if (select received_quantity from receipt_test.purchase_lines
     where purchase_id=p and item_id=item)<>3 then
  raise exception 'No se pudo reintentar con el mismo identificador'; end if;
 if (receipt_test.receive_purchase(req,p,
   jsonb_build_array(jsonb_build_object('item_id',item,'qty',3)))->>'replayed')<>'true' then
  raise exception 'No se reconoce el reintento exitoso'; end if;
 select count(*) into n from receipt_test.movements
 where request_id=req and reason='entrada compra';
 if n<>1 then raise exception 'Se duplicó movimiento tras reintento'; end if;
 raise notice 'PASS: rejected request ID reusable; successful replay has no duplicate movement';
end $$;
