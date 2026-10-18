-- AIHXO · Propuesta NO APLICADA: validar entradas antes de receive_stock_batch.
-- Importante: esta propuesta solo añade una validación a la función vigente.
-- Para integrarla hay que insertar el bloque PL/pgSQL al inicio de la función,
-- inmediatamente después de comprobar jsonb_typeof(p_items)='array'.
-- No ejecutar este fichero directamente: es un fragmento para revisión.
--
-- Valida cada item antes de tocar stock y rechaza referencias repetidas.
-- No proporciona idempotencia frente a peticiones HTTP repetidas.
declare
  v_bad_count integer;
begin
  if jsonb_array_length(p_items)=0 then
    raise exception 'La recepción debe contener al menos una prenda';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) as x(value)
    where jsonb_typeof(value)<>'object'
      or coalesce(value->>'item_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or coalesce(value->>'qty','') !~ '^[0-9]+$'
      or length(value->>'qty')>10
      or (case when length(value->>'qty')<=10 and (value->>'qty') ~ '^[0-9]+$'
          then (value->>'qty')::numeric between 1 and 2147483647 else false end) is not true
  ) then
    raise exception 'Referencia o cantidad de recepción no válida';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) as x(value)
    group by lower(value->>'item_id') having count(*)>1
  ) then
    raise exception 'La recepción contiene referencias duplicadas';
  end if;
end;
