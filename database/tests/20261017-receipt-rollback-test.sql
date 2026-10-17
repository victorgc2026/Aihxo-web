-- Fallo a mitad de recepción: comprobar rollback de movimientos y registro.
do $$
declare
  req uuid := '55555555-5555-4555-8555-555555555555';
  item_a uuid := '66666666-6666-4666-8666-666666666666';
  item_b uuid := '77777777-7777-4777-8777-777777777777';
  rejected boolean:=false;
  rows_before bigint;
begin
  select count(*) into rows_before from receipt_test.requests;
  -- El trigger de prueba simula un error tras escribir la primera línea.
  create or replace function receipt_test.reject_second_line()
    returns trigger language plpgsql as $fn$
    begin
      if new.item_id='77777777-7777-4777-8777-777777777777'::uuid then
        raise exception 'Error simulado de segunda línea';
      end if;
      return new;
    end;
    $fn$;
  create trigger receipt_test_failure before insert or update on receipt_test.stock
    for each row execute function receipt_test.reject_second_line();

  begin
    perform receipt_test.receive_once(req,jsonb_build_array(
      jsonb_build_object('item_id',item_a,'qty',2),
      jsonb_build_object('item_id',item_b,'qty',3)
    ));
  exception when others then rejected:=true; end;
  if not rejected then raise exception 'No se provocó el fallo simulado'; end if;
  if exists (select 1 from receipt_test.stock where item_id in (item_a,item_b)) then
    raise exception 'Quedó stock parcial tras fallo';
  end if;
  if exists (select 1 from receipt_test.requests where request_id=req) then
    raise exception 'Quedó solicitud parcial tras fallo';
  end if;
  if (select count(*) from receipt_test.requests)<>rows_before then
    raise exception 'El fallo modificó otras solicitudes';
  end if;
  drop trigger receipt_test_failure on receipt_test.stock;
  drop function receipt_test.reject_second_line();
  perform receipt_test.receive_once(req,jsonb_build_array(
    jsonb_build_object('item_id',item_a,'qty',2),
    jsonb_build_object('item_id',item_b,'qty',3)
  ));
  if (select quantity from receipt_test.stock where item_id=item_a)<>2
     or (select quantity from receipt_test.stock where item_id=item_b)<>3 then
    raise exception 'El reintento no registró las unidades esperadas';
  end if;
  raise notice 'PASS: fallo parcial revertido y reintento correcto';
end;
$$;
