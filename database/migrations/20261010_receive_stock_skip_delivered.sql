-- Corrects allocation to delivered orders. Does not modify stock counts until a receipt is processed.
CREATE OR REPLACE FUNCTION public.receive_stock_batch(p_items jsonb, p_purchase_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  rec jsonb;
  wait_order record;
  multi_order record;
  line_value jsonb;
  revised_lines jsonb;
  fully_allocated boolean;
  v_remaining integer;
  v_id uuid;
  v_qty integer;
  v_barcode text;
  v_prev integer;
  v_next integer;
  v_before_alloc integer;
  v_needed integer;
  v_reason text;
  v_count integer := 0;
  v_allocated integer := 0;
  v_cycle uuid;
  v_total_lines integer;
  v_complete_lines integer;
begin
  if auth.uid() is null then raise exception 'Sesión requerida'; end if;
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'p_items must be a JSON array';
  end if;

  select id into v_cycle from public.inventory_cycles where status='active' order by started_at desc limit 1;

  if p_purchase_id is not null then
    perform id from public.purchases where id=p_purchase_id for update;
    if not found then raise exception 'Compra no encontrada'; end if;
  end if;
  perform id from public.base_stock_items where id in (select (x->>'item_id')::uuid from jsonb_array_elements(p_items) x) order by id for update;
  for rec in select * from jsonb_array_elements(p_items) order by value->>'item_id'
  loop
    v_id := (rec->>'item_id')::uuid;
    if coalesce((rec->>'qty')::numeric,0)<=0 or (rec->>'qty')::numeric <> trunc((rec->>'qty')::numeric) then raise exception 'Cantidad de recepción no válida'; end if;
    v_qty := (rec->>'qty')::integer;
    if p_purchase_id is not null then
      select greatest(0,ordered_quantity-received_quantity) into v_remaining from public.purchase_lines where purchase_id=p_purchase_id and item_id=v_id for update;
      if not found then raise exception 'La prenda no pertenece a esta compra'; end if;
      if v_qty>v_remaining then raise exception 'La recepción supera las unidades pendientes; actualiza la compra'; end if;
    end if;
    v_barcode := nullif(btrim(rec->>'barcode'), '');

    select quantity into v_prev from public.base_stock_items where id=v_id for update;
    if not found then raise exception 'Stock item not found: %', v_id; end if;

    v_next := coalesce(v_prev,0)+v_qty;

    update public.base_stock_items
    set quantity=v_next,
        barcode=case when (barcode is null or barcode='') and v_barcode is not null then v_barcode else barcode end,
        updated_at=now()
    where id=v_id;

    v_reason := 'Recepción proveedor por lote' ||
      case when p_purchase_id is not null then ' · compra '||p_purchase_id::text else '' end ||
      case when v_barcode is not null then ' · código '||v_barcode else '' end;

    insert into public.base_stock_movements(item_id,movement_type,quantity_delta,previous_quantity,new_quantity,reason)
    values(v_id,'entrada',v_qty,v_prev,v_next,v_reason);

    if p_purchase_id is not null then
      insert into public.purchase_lines(purchase_id,item_id,ordered_quantity,received_quantity,unit_cost)
      values(p_purchase_id,v_id,0,v_qty,0)
      on conflict(purchase_id,item_id) do update
      set received_quantity=public.purchase_lines.received_quantity + excluded.received_quantity,
          updated_at=now();
    end if;

    for wait_order in
      select id, order_number, greatest(1,coalesce(nullif(base_stock_quantity,0),quantity,1)) as needed
      from public.orders
      where base_stock_item_id=v_id
        and coalesce(base_stock_allocated,false)=false
        and lower(coalesce(production_status,''))='pendiente llegada'
        and lower(btrim(coalesce(status,''))) not in ('cancelado','entregado')
      order by coalesce(base_stock_waiting_since,created_at), created_at
      for update
    loop
      v_needed := wait_order.needed;
      exit when v_next < v_needed;

      v_before_alloc := v_next;
      v_next := v_next - v_needed;

      update public.base_stock_items
      set quantity=v_next, updated_at=now()
      where id=v_id;

      insert into public.base_stock_movements(item_id,movement_type,quantity_delta,previous_quantity,new_quantity,reason)
      values(v_id,'salida',-v_needed,v_before_alloc,v_next,'Asignación automática · pedido '||coalesce(wait_order.order_number,wait_order.id::text)||' tras recepción');

      update public.orders
      set order_lines=case when jsonb_array_length(order_lines)=1 then jsonb_set(order_lines,'{0,allocated}','true') else order_lines end,
          base_stock_allocated=true,
          base_stock_allocated_at=now(),
          base_stock_waiting_since=null,
          production_status='Pendiente',
          production_updated_at=now()
      where id=wait_order.id;

      v_allocated := v_allocated + 1;
    end loop;

    -- Multi-variant orders reserve each received line; production waits for all lines.
    for multi_order in
      select id,order_number,order_lines from public.orders
      where base_stock_item_id is null and base_stock_allocated=false
        and lower(status) not in ('cancelado','entregado')
        and exists(select 1 from jsonb_array_elements(order_lines) x where x->>'item_id'=v_id::text and (x->>'allocated')::boolean=false)
      order by coalesce(base_stock_waiting_since,created_at),created_at for update
    loop
      revised_lines := '[]'; fully_allocated := true;
      for line_value in select * from jsonb_array_elements(multi_order.order_lines) loop
        if line_value->>'item_id'=v_id::text and (line_value->>'allocated')::boolean=false then
          v_needed := (line_value->>'quantity')::integer;
          if v_next>=v_needed then
            v_before_alloc:=v_next; v_next:=v_next-v_needed;
            update public.base_stock_items set quantity=v_next,updated_at=now() where id=v_id;
            insert into public.base_stock_movements(item_id,movement_type,quantity_delta,previous_quantity,new_quantity,reason)
            values(v_id,'salida',-v_needed,v_before_alloc,v_next,'Asignación automática · pedido '||multi_order.order_number);
            line_value:=jsonb_set(line_value,'{allocated}','true');
          end if;
        end if;
        fully_allocated:=fully_allocated and coalesce((line_value->>'allocated')::boolean,false);
        revised_lines:=revised_lines||jsonb_build_array(line_value);
      end loop;
      update public.orders set order_lines=revised_lines,base_stock_allocated=fully_allocated,
        base_stock_allocated_at=case when fully_allocated then now() else null end,
        base_stock_waiting_since=case when fully_allocated then null else base_stock_waiting_since end,
        production_status=case when fully_allocated then 'Pendiente' else 'Pendiente llegada' end,
        production_updated_at=now() where id=multi_order.id;
      if fully_allocated then v_allocated:=v_allocated+1; end if;
    end loop;

    if v_cycle is not null then
      update public.inventory_cycle_lines
      set counted_quantity=v_next, counted_at=now()
      where cycle_id=v_cycle and item_id=v_id;
    end if;

    v_count := v_count+1;
  end loop;

  if p_purchase_id is not null then
    select count(*) into v_total_lines from public.purchase_lines where purchase_id=p_purchase_id;
    select count(*) into v_complete_lines from public.purchase_lines where purchase_id=p_purchase_id and received_quantity >= ordered_quantity and ordered_quantity > 0;

    update public.purchases
    set status = case
      when v_total_lines > 0 and v_complete_lines = v_total_lines then 'Recibido'
      when exists(select 1 from public.purchase_lines where purchase_id=p_purchase_id and received_quantity > 0) then 'Parcial'
      else status
    end
    where id=p_purchase_id;
  end if;

  return jsonb_build_object('ok',true,'lines',v_count,'orders_allocated',v_allocated,'inventory_cycle_id',v_cycle);
end;
$function$;
