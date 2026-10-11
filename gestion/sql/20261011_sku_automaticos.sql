-- AIHXO · SKU independientes. Ejecutar en Supabase antes de desplegar la interfaz.
-- Las referencias existentes en products nunca se modifican.
create sequence if not exists public.aihxo_sku_base_seq start with 1;
create sequence if not exists public.aihxo_sku_design_seq start with 1;

alter table public.garments add column if not exists sku text;
create unique index if not exists garments_sku_unique on public.garments(sku) where sku is not null;
-- Se conserva la unicidad global de los SKU nuevos de productos mediante reserva de secuencia.

create or replace function public.aihxo_next_sku(p_kind text)
returns text language plpgsql security invoker set search_path = public as $$
declare n bigint; code text;
begin
  if p_kind = 'BASE' then
    loop
      n := nextval('public.aihxo_sku_base_seq');
      code := 'AIHXO-PB-' || lpad(n::text, 5, '0');
      exit when not exists (select 1 from public.garments where sku = code);
    end loop;
  elsif p_kind = 'DIS' then
    loop
      n := nextval('public.aihxo_sku_design_seq');
      code := 'AIHXO-DIS-' || lpad(n::text, 5, '0');
      exit when not exists (select 1 from public.products where sku = code);
    end loop;
  else
    raise exception 'Tipo SKU no permitido: %', p_kind;
  end if;
  return code;
end $$;

create or replace function public.aihxo_garment_sku_trigger()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.sku is null or btrim(new.sku) = '' then
    new.sku := public.aihxo_next_sku('BASE');
  end if;
  return new;
end $$;
drop trigger if exists trg_aihxo_garment_sku on public.garments;
create trigger trg_aihxo_garment_sku before insert on public.garments
for each row execute function public.aihxo_garment_sku_trigger();

-- Completar solo prendas existentes sin SKU, sin tocar IDs ni referencias previas.
update public.garments set sku = public.aihxo_next_sku('BASE') where sku is null or btrim(sku) = '';

create or replace function public.aihxo_product_sku_trigger()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.sku is null or btrim(new.sku) = '' then
    new.sku := public.aihxo_next_sku('DIS');
  end if;
  return new;
end $$;
drop trigger if exists trg_aihxo_product_sku on public.products;
create trigger trg_aihxo_product_sku before insert on public.products
for each row execute function public.aihxo_product_sku_trigger();

grant usage, select on sequence public.aihxo_sku_design_seq to authenticated;
grant usage, select on sequence public.aihxo_sku_base_seq to authenticated;
grant execute on function public.aihxo_next_sku(text) to authenticated;
