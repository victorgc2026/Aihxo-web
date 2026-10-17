-- AIHXO · Normalización de recepciones en PostgreSQL.
-- SOLO PARA PRUEBAS AISLADAS; no ejecutar en producción.
-- Devuelve un JSONB normalizado; el hash se calculará sobre su representación
-- en servidor cuando se integre en la RPC transaccional.
create or replace function public.canonical_stock_receipt(
  p_items jsonb,
  p_purchase_id uuid default null
)
returns jsonb
language plpgsql
immutable
set search_path=public
as $$
declare
  v_item jsonb;
  v_id uuid;
  v_qty_text text;
  v_qty numeric;
  v_items jsonb := '[]'::jsonb;
  v_seen uuid[] := '{}'::uuid[];
  v_barcode text;
begin
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)=0 then
    raise exception 'La recepción está vacía';
  end if;
  for v_item in select value from jsonb_array_elements(p_items) as t(value)
  loop
    if jsonb_typeof(v_item) is distinct from 'object'
       or jsonb_typeof(v_item->'item_id') is distinct from 'string'
       or coalesce(v_item->>'item_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'Referencia no válida';
    end if;
    v_id := (v_item->>'item_id')::uuid;
    if v_id=any(v_seen) then raise exception 'La recepción contiene referencias duplicadas'; end if;
    v_seen := array_append(v_seen,v_id);
    if jsonb_typeof(v_item->'qty') is distinct from 'number' then
      raise exception 'Cantidad no válida';
    end if;
    v_qty_text := v_item->>'qty';
    if v_qty_text !~ '^[0-9]+$' then raise exception 'Cantidad no válida'; end if;
    v_qty := v_qty_text::numeric;
    if v_qty<1 or v_qty>2147483647 then raise exception 'Cantidad no válida'; end if;
    if v_item ? 'barcode' and jsonb_typeof(v_item->'barcode') not in ('null','string') then
      raise exception 'Código de barras no válido';
    end if;
    v_barcode := nullif(btrim(v_item->>'barcode'),'');
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'item_id',v_id::text,'qty',v_qty::integer,'barcode',v_barcode
    ));
  end loop;
  return jsonb_build_object(
    'purchase_id',p_purchase_id,
    'items',(select coalesce(jsonb_agg(value order by value->>'item_id'),'[]'::jsonb)
             from jsonb_array_elements(v_items) as t(value))
  );
end;
$$;

-- No exponer esta función de prueba por la API.
revoke all on function public.canonical_stock_receipt(jsonb,uuid) from public, anon, authenticated;
