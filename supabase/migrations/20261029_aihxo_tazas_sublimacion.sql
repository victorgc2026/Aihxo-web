-- AIHXO · módulo de tazas y sublimación
-- Ejecutar en el proyecto Supabase AIHXO antes de habilitar el módulo.
create table if not exists public.mug_models (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  supplier_reference text,
  color text not null default 'Blanco',
  capacity_ml integer,
  size_label text,
  height_mm numeric,
  diameter_mm numeric,
  print_width_mm numeric,
  print_height_mm numeric,
  unit_cost numeric(10,2) not null default 0,
  sale_price numeric(10,2) not null default 0,
  stock integer not null default 0 check(stock>=0),
  min_stock integer not null default 2 check(min_stock>=0),
  notes text,
  created_at timestamptz default now()
);
create table if not exists public.mug_designs (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.mug_models(id),
  order_reference text,
  customer_reference text,
  name text not null,
  placement text not null default 'envolvente',
  print_width_mm numeric,
  print_height_mm numeric,
  original_path text,
  print_path text,
  approval_status text not null default 'pendiente',
  production_status text not null default 'pendiente',
  quantity integer not null default 1 check(quantity>0),
  notes text,
  created_at timestamptz default now()
);
create table if not exists public.mug_stock_movements (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.mug_models(id),
  quantity integer not null check(quantity<>0),
  type text not null,
  reference text,
  created_at timestamptz default now()
);
alter table public.mug_models enable row level security;
alter table public.mug_designs enable row level security;
alter table public.mug_stock_movements enable row level security;
create policy "aihxo_mug_models_admin" on public.mug_models for all to authenticated
  using (auth.jwt()->>'email'='aihxo.camisetas@gmail.com')
  with check (auth.jwt()->>'email'='aihxo.camisetas@gmail.com');
create policy "aihxo_mug_designs_admin" on public.mug_designs for all to authenticated
  using (auth.jwt()->>'email'='aihxo.camisetas@gmail.com')
  with check (auth.jwt()->>'email'='aihxo.camisetas@gmail.com');
create policy "aihxo_mug_stock_admin" on public.mug_stock_movements for all to authenticated
  using (auth.jwt()->>'email'='aihxo.camisetas@gmail.com')
  with check (auth.jwt()->>'email'='aihxo.camisetas@gmail.com');
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values ('aihxo-mug-designs','aihxo-mug-designs',false,15728640,array['image/png','image/jpeg','image/webp','application/pdf'])
 on conflict (id) do nothing;
create policy "aihxo_mugs_storage_read" on storage.objects for select to authenticated
 using (bucket_id='aihxo-mug-designs' and auth.jwt()->>'email'='aihxo.camisetas@gmail.com');
create policy "aihxo_mugs_storage_insert" on storage.objects for insert to authenticated
 with check (bucket_id='aihxo-mug-designs' and auth.jwt()->>'email'='aihxo.camisetas@gmail.com');
create policy "aihxo_mugs_storage_update" on storage.objects for update to authenticated
 using (bucket_id='aihxo-mug-designs' and auth.jwt()->>'email'='aihxo.camisetas@gmail.com')
 with check (bucket_id='aihxo-mug-designs' and auth.jwt()->>'email'='aihxo.camisetas@gmail.com');
create policy "aihxo_mugs_storage_delete" on storage.objects for delete to authenticated
 using (bucket_id='aihxo-mug-designs' and auth.jwt()->>'email'='aihxo.camisetas@gmail.com');
