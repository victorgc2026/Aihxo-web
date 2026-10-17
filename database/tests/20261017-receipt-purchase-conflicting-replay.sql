-- Una solicitud confirmada no puede reutilizarse con otra compra o cantidad.
do $$
declare
 p1 uuid:='c1111111-1111-4111-8111-111111111111';
 p2 uuid:='c2222222-2222-4222-8222-222222222222';
 item uuid:='c3333333-3333-4333-8333-333333333333';
 req uuid:='c4444444-4444-4444-8444-444444444444';
 rejected_qty boolean:=false;
 rejected_purchase boolean:=false;
 n bigint;
begin
 insert into receipt_test.purchases(id) values(p1),(p2);
 insert into receipt_test.purchase_lines(purchase_id,item_id,ordered_quantity)
 values(p1,item,5),(p2,item,5);
 perform receipt_test.receive_purchase(req,p1,
  jsonb_build_array(jsonb_build_object('item_id',item,'qty',2)));
 begin
  perform receipt_test.receive_purchase(req,p1,
   jsonb_build_array(jsonb_build_object('item_id',item,'qty',3)));
 exception when others then rejected_qty:=true; end;
 if not rejected_qty then raise exception 'Se aceptó misma solicitud con otra cantidad'; end if;
 begin
  perform receipt_test.receive_purchase(req,p2,
   jsonb_build_array(jsonb_build_object('item_id',item,'qty',2)));
 exception when others then rejected_purchase:=true; end;
 if not rejected_purchase then raise exception 'Se aceptó misma solicitud en otra compra'; end if;
 select quantity into n from receipt_test.stock where item_id=item;
 if n<>2 then raise exception 'Stock cambió tras conflictos: %',n; end if;
 if (select received_quantity from receipt_test.purchase_lines
  where purchase_id=p2 and item_id=item)<>0 then
  raise exception 'Segunda compra recibió unidades indebidamente'; end if;
 select count(*) into n from receipt_test.movements
 where request_id=req and reason='entrada compra';
 if n<>1 then raise exception 'Movimientos duplicados por conflicto'; end if;
 raise notice 'PASS: same request ID cannot change purchase or quantities';
end $$;
