-- AIHXO: atomic order creation, multi-size orders and payment history.
-- Additive, invoker functions: existing RLS remains authoritative.
create or replace function public.quick_order_garment(p_manufacturer text,p_model text,p_size text,p_color text,p_cost numeric)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare g public.garments%rowtype; s public.base_stock_items%rowtype;
begin
 if auth.uid() is null then raise exception 'Sesión requerida'; end if;
 if nullif(btrim(p_manufacturer),'') is null or nullif(btrim(p_model),'') is null or nullif(btrim(p_size),'') is null or nullif(btrim(p_color),'') is null or p_cost is null or p_cost<0 or p_cost::text in ('NaN','Infinity','-Infinity') then raise exception 'Completa marca, modelo, talla, color y coste'; end if;
 perform pg_advisory_xact_lock(hashtextextended(lower(btrim(p_manufacturer)||'|'||btrim(p_model)),0));
 select * into g from public.garments where lower(btrim(manufacturer))=lower(btrim(p_manufacturer)) and lower(btrim(model))=lower(btrim(p_model)) order by created_at limit 1;
 if not found then
 insert into public.garments(manufacturer,model,garment_type,audience,sizes,colors) values(btrim(p_manufacturer),btrim(p_model),'Camiseta','Unisex',jsonb_build_array(btrim(p_size)),jsonb_build_array(btrim(p_color))) returning * into g;
 else
 update public.garments set sizes=case when sizes @> jsonb_build_array(btrim(p_size)) then sizes else sizes||jsonb_build_array(btrim(p_size)) end, colors=case when colors @> jsonb_build_array(btrim(p_color)) then colors else colors||jsonb_build_array(btrim(p_color)) end where id=g.id;
 end if;
 select * into s from public.base_stock_items where garment_id=g.id and lower(btrim(size))=lower(btrim(p_size)) and lower(btrim(color))=lower(btrim(p_color)) order by created_at limit 1;
 if not found then
 insert into public.base_stock_items(garment_id,garment_type,supplier,supplier_model,audience,size,color,unit_cost,quantity) values(g.id,coalesce(g.garment_type,'Camiseta'),g.manufacturer,g.model,coalesce(g.audience,'Unisex'),btrim(p_size),btrim(p_color),p_cost,0) returning * into s;
 end if;
 return to_jsonb(s);
end;$$;
revoke all on function public.quick_order_garment(text,text,text,text,numeric) from public,anon;
grant execute on function public.quick_order_garment(text,text,text,text,numeric) to authenticated;
alter table public.orders add column if not exists order_lines jsonb not null default '[]';
alter table public.orders add column if not exists print_zones jsonb not null default '[]';
alter table public.orders add column if not exists estimated_costs jsonb not null default '{}';

-- Graci already has order access; stock operations must allow the same team.
alter policy "AIHXO admin reads base stock" on public.base_stock_items using (lower(coalesce(auth.jwt()->>'email','')) in ('aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com'));
alter policy "AIHXO admin inserts base stock" on public.base_stock_items with check (lower(coalesce(auth.jwt()->>'email','')) in ('aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com'));
alter policy "AIHXO admin updates base stock" on public.base_stock_items using (lower(coalesce(auth.jwt()->>'email','')) in ('aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com')) with check (lower(coalesce(auth.jwt()->>'email','')) in ('aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com'));
alter policy "AIHXO admin deletes base stock" on public.base_stock_items using (lower(coalesce(auth.jwt()->>'email','')) in ('aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com'));
alter policy "AIHXO admin reads base movements" on public.base_stock_movements using (lower(coalesce(auth.jwt()->>'email','')) in ('aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com'));
alter policy "AIHXO admin inserts base movements" on public.base_stock_movements with check (lower(coalesce(auth.jwt()->>'email','')) in ('aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com'));

create or replace function public.create_order_atomic(p_request_id uuid, p_order jsonb, p_lines jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
 o public.orders%rowtype; c public.customers%rowtype; s public.base_stock_items%rowtype; p public.products%rowtype;
 l jsonb; lines jsonb := '[]'; typ text := p_order->>'order_type'; q integer; price numeric;
 total_qty integer := 0; subtotal numeric := 0; garment numeric := 0; catalog_cost numeric := 0;
 ship numeric := coalesce((p_order->>'shipping')::numeric,0); extra numeric; all_alloc boolean := true;
 allocated boolean; number_next bigint; source text := coalesce(p_order->>'design_source','aihxo');
begin
 if auth.uid() is null then raise exception 'Sesión requerida'; end if;
 if p_request_id is null or typ not in ('personalizado','diseno_aihxo','catalogo') or typ is null then raise exception 'Pedido no válido'; end if;
 if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines) not between 1 and 100 then raise exception 'Añade entre 1 y 100 líneas'; end if;
 -- Serializes numbering and retries; stock rows are locked against receipts as well.
 perform pg_advisory_xact_lock(62418002);
 select * into o from public.orders where id=p_request_id;
 if found then return to_jsonb(o); end if;
 if ship < 0 or ship::text in ('NaN','Infinity','-Infinity') then raise exception 'Envío no válido'; end if;
 if nullif(btrim(p_order->>'customer_name'),'') is null then raise exception 'Indica el cliente'; end if;
 if nullif(p_order->>'customer_id','') is not null then
   select * into c from public.customers where id=(p_order->>'customer_id')::uuid;
   if not found then raise exception 'Cliente no encontrado'; end if;
 else
   insert into public.customers(name,contact) values(btrim(p_order->>'customer_name'),nullif(btrim(p_order->>'contact'),'')) returning * into c;
 end if;
 -- Consistent stock lock order for orders spanning several variants.
 perform id from public.base_stock_items where id in (select (x->>'item_id')::uuid from jsonb_array_elements(p_lines) x where nullif(x->>'item_id','') is not null) order by id for update;
 perform id from public.products where id in (select (x->>'product_id')::uuid from jsonb_array_elements(p_lines) x where nullif(x->>'product_id','') is not null) order by id for update;
 for l in select * from jsonb_array_elements(p_lines) loop
   if coalesce((l->>'quantity')::numeric,0) <> trunc(coalesce((l->>'quantity')::numeric,0)) then raise exception 'La cantidad debe ser entera'; end if;
   q := (l->>'quantity')::integer; price := (l->>'unit_price')::numeric;
   if q is null or q<=0 or price is null or price<0 or price::text in ('NaN','Infinity','-Infinity') then raise exception 'Cantidad o precio no válido'; end if;
   s := null; p := null; allocated := true;
   if typ in ('catalogo','diseno_aihxo') then
     select * into p from public.products where id=(l->>'product_id')::uuid;
     if not found then raise exception 'Producto no encontrado'; end if;
   end if;
   if typ='catalogo' then
     if coalesce(p.stock,0)<q then raise exception 'Stock insuficiente: %',p.model; end if;
     update public.products set stock=stock-q where id=p.id;
     catalog_cost := catalog_cost + q*(coalesce(p.garment_cost,0)+coalesce(p.dtf_cost,0)+coalesce(p.extras_cost,0));
   else
     select * into s from public.base_stock_items where id=(l->>'item_id')::uuid;
     if not found then raise exception 'Selecciona la prenda de cada línea'; end if;
     allocated := s.quantity>=q;
     if allocated then
       update public.base_stock_items set quantity=quantity-q,updated_at=now() where id=s.id;
       insert into public.base_stock_movements(item_id,movement_type,quantity_delta,previous_quantity,new_quantity,reason)
       values(s.id,'salida',-q,s.quantity,s.quantity-q,'Reserva pedido '||p_request_id::text);
     end if;
     garment := garment + q*s.unit_cost;
   end if;
   all_alloc := all_alloc and allocated;
   total_qty := total_qty+q; subtotal := subtotal+q*price;
   lines := lines || jsonb_build_array(jsonb_build_object('item_id',s.id,'product_id',p.id,'model',coalesce(s.supplier_model,p.model),'size',coalesce(s.size,p.size),'color',coalesce(s.color,p.color),'quantity',q,'unit_price',price,'unit_cost',coalesce(s.unit_cost,p.garment_cost,0),'allocated',allocated));
 end loop;
 select coalesce(max(substring(order_number from '^AIHXO-([0-9]+)$')::bigint),0)+1 into number_next from public.orders;
 extra := coalesce((p_order#>>'{estimated_costs,dtf}')::numeric,0)+coalesce((p_order#>>'{estimated_costs,packaging}')::numeric,0)+coalesce((p_order#>>'{estimated_costs,transport}')::numeric,0)+coalesce((p_order#>>'{estimated_costs,extras}')::numeric,0);
 if exists(select 1 from jsonb_each_text(coalesce(p_order->'estimated_costs','{}')) x where x.value::numeric<0 or x.value::numeric::text in ('NaN','Infinity','-Infinity')) then raise exception 'Costes no válidos'; end if;
 insert into public.orders(id,order_number,customer_id,customer_name,contact,order_type,product_id,product_name,size,color,design,quantity,unit_price,shipping,total,product_cost,base_stock_item_id,base_stock_quantity,base_stock_allocated,base_stock_waiting_since,base_stock_allocated_at,production_status,design_approval_status,design_source,customer_file_final,ai_design_allowed,order_lines,print_zones,estimated_costs)
 values(p_request_id,'AIHXO-'||lpad(number_next::text,greatest(4,length(number_next::text)),'0'),c.id,c.name,coalesce(nullif(p_order->>'contact',''),c.contact),typ,
 case when jsonb_array_length(lines)=1 then (lines->0->>'product_id')::uuid else null end,
 case when typ='personalizado' then 'Producto personalizado' when jsonb_array_length(lines)=1 then p.model else 'Pedido con varias prendas' end,
 (select string_agg(distinct x->>'size',', ') from jsonb_array_elements(lines) x),
 (select string_agg(distinct x->>'color',', ') from jsonb_array_elements(lines) x),p_order->>'design',total_qty,subtotal/total_qty,ship,subtotal+ship,
 case when typ='catalogo' then catalog_cost+extra else garment+extra end,
 case when jsonb_array_length(lines)=1 then (lines->0->>'item_id')::uuid else null end,
 case when typ='catalogo' then 0 else total_qty end,all_alloc,case when not all_alloc then now() end,case when all_alloc then now() end,
 case when all_alloc then 'Pendiente' else 'Pendiente llegada' end,case when typ='personalizado' then 'Pendiente cliente' else 'No aplica' end,
 source,source='customer_final',source<>'customer_final',lines,coalesce(p_order->'print_zones','[]'),coalesce(p_order->'estimated_costs','{}')||jsonb_build_object('garment',garment)) returning * into o;
 return to_jsonb(o);
end;
$$;
revoke all on function public.create_order_atomic(uuid,jsonb,jsonb) from public,anon;
grant execute on function public.create_order_atomic(uuid,jsonb,jsonb) to authenticated;

create table public.order_payments(
 id uuid primary key,order_id uuid not null references public.orders(id) on delete restrict,
 amount numeric(12,2) not null check(amount<>0),method text not null,
 paid_at timestamptz not null default now(),note text not null default '',created_by uuid default auth.uid()
);
create index order_payments_order_id_idx on public.order_payments(order_id);
alter table public.order_payments enable row level security;
create policy "AIHXO team payment history" on public.order_payments for select to authenticated
 using(lower(coalesce(auth.jwt()->>'email','')) in ('aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com'));
create policy "AIHXO team record payments" on public.order_payments for insert to authenticated
 with check(lower(coalesce(auth.jwt()->>'email','')) in ('aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com'));
revoke all on public.order_payments from anon;
grant select,insert on public.order_payments to authenticated;

create or replace function public.record_order_payment(p_id uuid,p_order_id uuid,p_amount numeric,p_method text,p_note text default '',p_paid_at timestamptz default now())
returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.orders%rowtype; paid numeric; n integer;
begin
 if auth.uid() is null then raise exception 'Sesión requerida'; end if;
 select * into o from public.orders where id=p_order_id for update;
 if not found then raise exception 'Pedido no encontrado'; end if;
 if exists(select 1 from public.order_payments where id=p_id and order_id=p_order_id) then return to_jsonb(o); end if;
 if p_amount is null or p_amount=0 or p_amount::text in ('NaN','Infinity','-Infinity') or p_amount<>round(p_amount,2) or nullif(btrim(p_method),'') is null or p_paid_at is null then raise exception 'Importe, fecha o método no válido'; end if;
 if p_amount<0 and nullif(btrim(p_note),'') is null then raise exception 'Indica el motivo de la devolución'; end if;
 if lower(o.status)='cancelado' and p_amount>0 then raise exception 'No se puede cobrar un pedido cancelado'; end if;
 paid:=o.amount_paid+p_amount;
 if paid<0 or paid>o.total then raise exception 'El cobro supera el pendiente o la devolución supera lo cobrado'; end if;
 -- Preserve the legacy accumulated amount without inventing its individual payments.
 if o.amount_paid>0 and not exists(select 1 from public.order_payments where order_id=o.id) then
 insert into public.order_payments(id,order_id,amount,method,paid_at,note) values(gen_random_uuid(),o.id,o.amount_paid,coalesce(o.payment_method,'Sin método'),coalesce(o.paid_at,o.created_at),'Saldo anterior al historial; fecha original no disponible si no constaba');
 end if;
 insert into public.order_payments(id,order_id,amount,method,paid_at,note) values(p_id,o.id,p_amount,btrim(p_method),p_paid_at,coalesce(p_note,''));
 select count(distinct method) into n from public.order_payments where order_id=o.id;
 update public.orders set amount_paid=paid,payment_status=case when paid>=total then 'Pagado' when paid>0 then 'Parcial' else 'Pendiente' end,
 payment_method=case when n>1 then 'Varios' else p_method end,paid_at=case when paid>=total then p_paid_at else null end where id=o.id returning * into o;
 return to_jsonb(o);
end;
$$;
revoke all on function public.record_order_payment(uuid,uuid,numeric,text,text,timestamptz) from public,anon;
grant execute on function public.record_order_payment(uuid,uuid,numeric,text,text,timestamptz) to authenticated;

-- Check new invoice references without changing historical duplicates.
create or replace function public.check_purchase_reference() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.supplier_id is not null and nullif(btrim(new.purchase_number),'') is not null then
 perform pg_advisory_xact_lock(hashtextextended(new.supplier_id::text||lower(btrim(new.purchase_number)),0));
 if exists(select 1 from public.purchases where supplier_id=new.supplier_id and lower(btrim(purchase_number))=lower(btrim(new.purchase_number)) and id<>new.id) then raise exception 'Ya existe una compra con este proveedor y referencia'; end if;
 end if;return new;
end;$$;
revoke all on function public.check_purchase_reference() from public,anon;
create trigger check_purchase_reference before insert or update of supplier_id,purchase_number on public.purchases for each row execute function public.check_purchase_reference();

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
        and lower(coalesce(status,'')) <> 'cancelado'
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
$function$

;
revoke all on function public.receive_stock_batch(jsonb,uuid) from public,anon;
grant execute on function public.receive_stock_batch(jsonb,uuid) to authenticated;

-- Legacy numbering reads must respect the caller's RLS; trigger functions are not RPC endpoints.
alter function public.next_aihxo_order_number() security invoker;
revoke all on function public.next_aihxo_order_number() from public,anon;
grant execute on function public.next_aihxo_order_number() to authenticated;
revoke all on function public.record_stock_movement() from public,anon,authenticated;
