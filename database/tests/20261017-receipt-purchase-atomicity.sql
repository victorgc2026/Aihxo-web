-- Prueba de atomicidad de compras: segunda línea incorrecta revierte la primera.
do $$
declare
 p uuid:='33333333-3333-4333-8333-333333333333';
 a uuid:='44444444-4444-4444-8444-444444444444';
 b uuid:='55555555-5555-4555-8555-555555555555';
 req uuid:='66666666-6666-4666-8666-666666666666';
 failed boolean:=false;
 n bigint;
begin
 insert into receipt_test.purchases(id) values(p);
 insert into receipt_test.purchase_lines(purchase_id,item_id,ordered_quantity)
 values(p,a,5),(p,b,2);
 begin
  perform receipt_test.receive_purchase(req,p,jsonb_build_array(
   jsonb_build_object('item_id',a,'qty',3),
   jsonb_build_object('item_id',b,'qty',4)));
 exception when others then failed:=true; end;
 if not failed then raise exception 'Lote con segunda línea excesiva no fue rechazado'; end if;
 select coalesce(sum(received_quantity),0) into n
 from receipt_test.purchase_lines where purchase_id=p;
 if n<>0 then raise exception 'Compra quedó parcialmente registrada: %',n; end if;
 select count(*) into n from receipt_test.stock where item_id in (a,b);
 if n<>0 then raise exception 'Stock parcial persistido'; end if;
 select count(*) into n from receipt_test.movements where request_id=req;
 if n<>0 then raise exception 'Movimientos parciales persistidos'; end if;
 select count(*) into n from receipt_test.requests where request_id=req;
 if n<>0 then raise exception 'Solicitud fallida dejó ledger bloqueado'; end if;
 perform receipt_test.receive_purchase(req,p,jsonb_build_array(
   jsonb_build_object('item_id',a,'qty',3),
   jsonb_build_object('item_id',b,'qty',2)));
 if (select status from receipt_test.purchases where id=p)<>'Parcial' then
  raise exception 'Estado incorrecto tras reintento válido'; end if;
 select coalesce(sum(received_quantity),0) into n
 from receipt_test.purchase_lines where purchase_id=p;
 if n<>5 then raise exception 'Reintento válido esperaba 5 unidades, recibió %',n; end if;
 raise notice 'PASS: multi-line purchase rollback is atomic and safe to retry';
end $$;
