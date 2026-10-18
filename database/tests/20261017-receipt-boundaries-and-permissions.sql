-- Tests adicionales de límites y permisos (solo PostgreSQL desechable)
do $$
declare
  a text := '11111111-1111-4111-8111-111111111111';
  result jsonb;
  failed boolean;
begin
  result:=public.canonical_stock_receipt(
    jsonb_build_array(jsonb_build_object('item_id',a,'qty',2147483647,'barcode',' 000123 ')),null);
  if result #>> '{items,0,barcode}' <> '000123' then
    raise exception 'Se han perdido ceros iniciales del código';
  end if;
  if (result #>> '{items,0,qty}')::bigint <> 2147483647 then
    raise exception 'El máximo entero válido ha cambiado';
  end if;
  failed:=false;
  begin
    perform public.canonical_stock_receipt(
      jsonb_build_array(jsonb_build_object('item_id',a,'qty',2147483648)),null);
  exception when others then failed:=true; end;
  if not failed then raise exception 'Aceptó cantidad fuera de rango'; end if;
  failed:=false;
  begin
    perform public.canonical_stock_receipt(
      jsonb_build_array(jsonb_build_object('item_id',a,'qty',-1)),null);
  exception when others then failed:=true; end;
  if not failed then raise exception 'Aceptó cantidad negativa'; end if;
  if has_function_privilege('anon','public.canonical_stock_receipt(jsonb,uuid)','EXECUTE') then
    raise exception 'La función quedó expuesta a anon';
  end if;
  if has_function_privilege('authenticated','public.canonical_stock_receipt(jsonb,uuid)','EXECUTE') then
    raise exception 'La función quedó expuesta a authenticated';
  end if;
  raise notice 'PASS: limits, barcode leading zeros, API role permissions';
end;
$$;
