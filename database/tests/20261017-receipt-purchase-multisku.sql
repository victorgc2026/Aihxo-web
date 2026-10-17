-- Ensayo aislado: una compra con dos referencias debe quedar Parcial
-- hasta que todas sus líneas alcancen la cantidad pedida.
do $$
declare
 p uuid:='a1111111-1111-4111-8111-111111111111';
 a uuid:='a2222222-2222-4222-8222-222222222222';
 b uuid:='a3333333-3333-4333-8333-333333333333';
 r1 uuid:='a4444444-4444-4444-8444-444444444444';
 r2 uuid:='a5555555-5555-4555-8555-555555555555';
 r3 uuid:='a6666666-6666-4666-8666-666666666666';
 n bigint;
begin
 insert into receipt_test.purchases(id) values(p);
 insert into receipt_test.purchase_lines(purchase_id,item_id,ordered_quantity)
 values(p,a,3),(p,b,2);
 perform receipt_test.receive_purchase(r1,p,
  jsonb_build_array(jsonb_build_object('item_id',a,'qty',3)));
 if (select status from receipt_test.purchases where id=p)<>'Parcial' then
  raise exception 'Compra marcada Recibido sin segunda referencia'; end if;
 perform receipt_test.receive_purchase(r2,p,
  jsonb_build_array(jsonb_build_object('item_id',b,'qty',1)));
 if (select status from receipt_test.purchases where id=p)<>'Parcial' then
  raise exception 'Compra marcada Recibido con una unidad pendiente'; end if;
 perform receipt_test.receive_purchase(r3,p,
  jsonb_build_array(jsonb_build_object('item_id',b,'qty',1)));
 if (select status from receipt_test.purchases where id=p)<>'Recibido' then
  raise exception 'Compra no marcada Recibido al completar ambas referencias'; end if;
 select sum(received_quantity) into n from receipt_test.purchase_lines where purchase_id=p;
 if n<>5 then raise exception 'Esperadas 5 unidades recibidas, hay %',n; end if;
 raise notice 'PASS: purchase with two SKUs stays partial until both are complete';
end $$;
