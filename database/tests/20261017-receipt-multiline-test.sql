do $$
declare
 a uuid:='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
 b uuid:='bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb';
 req uuid:='eeeeeeee-1111-4111-8111-eeeeeeeeeeee';
 order_id uuid:='ffffffff-1111-4111-8111-ffffffffffff';
 cancelled_id uuid:='ffffffff-2222-4222-8222-ffffffffffff';
 n integer;
 qty bigint;
begin
 insert into receipt_test.stock(item_id,quantity) values(a,1),(b,0);
 insert into receipt_test.multi_orders(id,status,lines) values
 (order_id,'Pendiente',jsonb_build_array(
   jsonb_build_object('item_id',a,'quantity',1,'allocated',false),
   jsonb_build_object('item_id',b,'quantity',2,'allocated',false))),
 (cancelled_id,'Cancelado',jsonb_build_array(
   jsonb_build_object('item_id',a,'quantity',1,'allocated',false),
   jsonb_build_object('item_id',b,'quantity',1,'allocated',false)));
 n:=receipt_test.allocate_multi(req,a);
 if n<>0 then raise exception 'Pedido completado antes de tener todas las prendas'; end if;
 if (select production_status from receipt_test.multi_orders where id=order_id)<>'Pendiente llegada' then
   raise exception 'Pedido salió prematuramente de espera'; end if;
 if (select quantity from receipt_test.stock where item_id=a)<>0 then
   raise exception 'Primera línea no reservada'; end if;
 update receipt_test.stock set quantity=2 where item_id=b;
 n:=receipt_test.allocate_multi(req,b);
 if n<>1 then raise exception 'Pedido no completado tras recibir segunda prenda'; end if;
 if (select production_status from receipt_test.multi_orders where id=order_id)<>'Pendiente' then
   raise exception 'Pedido no pasó a Pendiente'; end if;
 if (select allocated from receipt_test.multi_orders where id=cancelled_id) then
   raise exception 'Pedido cancelado asignado'; end if;
 n:=receipt_test.allocate_multi(req,b);
 if n<>0 then raise exception 'Segunda asignación inesperada'; end if;
 select count(*) into n from receipt_test.movements
   where request_id=req and reason='asignacion multi';
 if n<>2 then raise exception 'Movimientos multilínea esperados 2, encontrados %',n; end if;
 raise notice 'PASS: multi-line order waits for all items, excludes cancelled, no duplicate allocation';
end $$;
