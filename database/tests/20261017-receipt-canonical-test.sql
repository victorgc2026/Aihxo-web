-- AIHXO · Pruebas PostgreSQL para ejecutar SOLO en entorno aislado
-- Requiere cargar antes 20261017-receipt-canonical-postgres.sql.
-- No escribe stock ni pedidos; los errores esperados se capturan.
do $$
declare
  a uuid := '11111111-1111-4111-8111-111111111111';
  b uuid := '22222222-2222-4222-8222-222222222222';
  purchase uuid := '33333333-3333-4333-8333-333333333333';
  x jsonb;
  y jsonb;
  failed boolean;
begin
  x:=public.canonical_stock_receipt(
    jsonb_build_array(
      jsonb_build_object('item_id',b,'qty',3,'barcode',' B '),
      jsonb_build_object('item_id',a,'qty',2,'barcode',null)
    ),purchase);
  y:=public.canonical_stock_receipt(
    jsonb_build_array(
      jsonb_build_object('item_id',upper(a::text),'qty',2,'barcode',''),
      jsonb_build_object('item_id',b,'qty',3,'barcode','B')
    ),purchase);
  if x<>y then raise exception 'Orden o normalización inconsistentes'; end if;
  if x->>'purchase_id'<>purchase::text then raise exception 'Compra ausente'; end if;
  if jsonb_array_length(x->'items')<>2 then raise exception 'Número de líneas incorrecto'; end if;

  failed:=false;
  begin
    perform public.canonical_stock_receipt('[]'::jsonb,null);
  exception when others then failed:=true; end;
  if not failed then raise exception 'Aceptó recepción vacía'; end if;

  failed:=false;
  begin
    perform public.canonical_stock_receipt(
      jsonb_build_array(jsonb_build_object('item_id',a,'qty','2')),null);
  exception when others then failed:=true; end;
  if not failed then raise exception 'Aceptó cantidad de texto'; end if;

  failed:=false;
  begin
    perform public.canonical_stock_receipt(
      jsonb_build_array(jsonb_build_object('item_id',a,'qty',1),
                        jsonb_build_object('item_id',a,'qty',2)),null);
  exception when others then failed:=true; end;
  if not failed then raise exception 'Aceptó referencia duplicada'; end if;

  failed:=false;
  begin
    perform public.canonical_stock_receipt(
      jsonb_build_array(jsonb_build_object('item_id',a,'qty',1,'barcode',123)),null);
  exception when others then failed:=true; end;
  if not failed then raise exception 'Aceptó código de barras numérico'; end if;

  raise notice 'PASS: canonical_stock_receipt PostgreSQL vectors';
end;
$$;
