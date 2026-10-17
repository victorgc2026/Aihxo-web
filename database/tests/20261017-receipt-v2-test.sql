do $$
declare
 item uuid:='d1111111-1111-4111-8111-111111111111';
 req uuid:='d2222222-2222-4222-8222-222222222222';
 p jsonb;
 failed boolean:=false;
 n bigint;
begin
 p:=jsonb_build_array(jsonb_build_object('item_id',item,'qty',3));
 if (receipt_test.receive_stock_batch_v2(req,p)->>'replayed')<>'false' then
  raise exception 'Primera llamada no procesada'; end if;
 if (receipt_test.receive_stock_batch_v2(req,p)->>'replayed')<>'true' then
  raise exception 'Repetición no reconocida'; end if;
 begin
  perform receipt_test.receive_stock_batch_v2(req,
   jsonb_build_array(jsonb_build_object('item_id',item,'qty',4)));
 exception when others then failed:=true; end;
 if not failed then raise exception 'Reutilización conflictiva aceptada'; end if;
 select quantity into n from receipt_test.stock where item_id=item;
 if n<>3 then raise exception 'Stock duplicado: %',n; end if;
 select count(*) into n from receipt_test.movements
 where request_id=req and reason='entrada v2';
 if n<>1 then raise exception 'Movimientos duplicados: %',n; end if;
 raise notice 'PASS: versioned isolated v2 receipt accepts first, replays, rejects conflict';
end $$;
