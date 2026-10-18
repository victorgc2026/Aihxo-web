-- Ensayo aislado de pedidos con varias líneas de prendas.
-- No toca public.orders ni ninguna tabla real de producción.
create table receipt_test.multi_orders (
  id uuid primary key,
  status text not null,
  lines jsonb not null,
  allocated boolean not null default false,
  production_status text not null default 'Pendiente llegada'
);
create or replace function receipt_test.allocate_multi(p_request_id uuid,p_item uuid)
returns integer language plpgsql as $$
declare
  o record;
  line jsonb;
  new_lines jsonb;
  available bigint;
  needed bigint;
  all_ready boolean;
  newly_completed integer:=0;
begin
  for o in select id,lines from receipt_test.multi_orders
    where allocated=false and lower(btrim(status)) not in ('cancelado','entregado')
      and exists (
        select 1 from jsonb_array_elements(lines) l
        where l->>'item_id'=p_item::text
          and coalesce((l->>'allocated')::boolean,false)=false
      )
    order by id for update
  loop
    new_lines:='[]'::jsonb;
    all_ready:=true;
    for line in select value from jsonb_array_elements(o.lines) t(value)
    loop
      if line->>'item_id'=p_item::text
         and coalesce((line->>'allocated')::boolean,false)=false then
        needed:=(line->>'quantity')::bigint;
        if needed<=0 then raise exception 'Cantidad inválida en pedido'; end if;
        select quantity into available from receipt_test.stock
          where item_id=p_item for update;
        if coalesce(available,0)>=needed then
          update receipt_test.stock set quantity=quantity-needed where item_id=p_item;
          insert into receipt_test.movements(request_id,item_id,delta,reason)
            values(p_request_id,p_item,-needed,'asignacion multi');
          line:=jsonb_set(line,'{allocated}','true'::jsonb);
        end if;
      end if;
      all_ready:=all_ready and coalesce((line->>'allocated')::boolean,false);
      new_lines:=new_lines||jsonb_build_array(line);
    end loop;
    update receipt_test.multi_orders set lines=new_lines,
      allocated=all_ready,
      production_status=case when all_ready then 'Pendiente' else 'Pendiente llegada' end
      where id=o.id;
    if all_ready then newly_completed:=newly_completed+1; end if;
  end loop;
  return newly_completed;
end;
$$;
