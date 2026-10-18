do $$
declare
  id uuid := '44444444-4444-4444-8444-444444444444';
  item uuid := '11111111-1111-4111-8111-111111111111';
  first_result jsonb;
  second_result jsonb;
  failed boolean:=false;
  qty bigint;
begin
  first_result:=receipt_test.receive_once(id,
    jsonb_build_array(jsonb_build_object('item_id',item,'qty',5)));
  second_result:=receipt_test.receive_once(id,
    jsonb_build_array(jsonb_build_object('item_id',item,'qty',5)));
  if first_result->>'replayed'<>'false' or second_result->>'replayed'<>'true' then
    raise exception 'Replay incorrecto';
  end if;
  select quantity into qty from receipt_test.stock where item_id=item;
  if qty<>5 then raise exception 'Recepción duplicada: %',qty; end if;
  begin
    perform receipt_test.receive_once(id,
      jsonb_build_array(jsonb_build_object('item_id',item,'qty',6)));
  exception when others then failed:=true; end;
  if not failed then raise exception 'Reutilización de UUID con distinta carga permitida'; end if;
  select quantity into qty from receipt_test.stock where item_id=item;
  if qty<>5 then raise exception 'Un conflicto modificó el stock'; end if;
  raise notice 'PASS: replay una sola vez y conflicto sin cambios de stock';
end;
$$;
