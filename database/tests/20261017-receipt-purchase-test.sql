do $$
declare
 p uuid:='12345678-1234-4234-8234-123456789012';
 i uuid:='abcdefab-cdef-4def-8def-abcdefabcdef';
 r1 uuid:='10000000-0000-4000-8000-000000000001';
 r2 uuid:='10000000-0000-4000-8000-000000000002';
 payload jsonb;
 n bigint;
 rejected boolean:=false;
begin
 insert into receipt_test.purchases(id) values(p);
 insert into receipt_test.purchase_lines(purchase_id,item_id,ordered_quantity)
 values(p,i,10);
 payload:=jsonb_build_array(jsonb_build_object('item_id',i,'qty',4));
 perform receipt_test.receive_purchase(r1,p,payload);
 if (select status from receipt_test.purchases where id=p)<>'Parcial' then
  raise exception 'Compra no marcada Parcial';
 end if;
 if (receipt_test.receive_purchase(r1,p,payload)->>'replayed')<>'true' then
  raise exception 'Reintento no reconocido';
 end if;
 select received_quantity into n from receipt_test.purchase_lines
 where purchase_id=p and item_id=i;
 if n<>4 then raise exception 'Reintento duplicó cantidad recibida'; end if;
 begin
  perform receipt_test.receive_purchase(r2,p,
   jsonb_build_array(jsonb_build_object('item_id',i,'qty',7)));
 exception when others then rejected:=true; end;
 if not rejected then raise exception 'Exceso de recepción no rechazado'; end if;
 perform receipt_test.receive_purchase(r2,p,
  jsonb_build_array(jsonb_build_object('item_id',i,'qty',6)));
 if (select status from receipt_test.purchases where id=p)<>'Recibido' then
  raise exception 'Compra no marcada Recibido';
 end if;
 select received_quantity into n from receipt_test.purchase_lines
 where purchase_id=p and item_id=i;
 if n<>10 then raise exception 'Cantidad final esperada 10, real %',n; end if;
 select count(*) into n from receipt_test.movements
 where item_id=i and reason='entrada compra';
 if n<>2 then raise exception 'Esperados exactamente 2 movimientos, real %',n; end if;
 raise notice 'PASS: partial 4, replay safe, overreceipt rejected, remaining 6 complete';
end $$;
