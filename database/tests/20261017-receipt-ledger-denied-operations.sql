-- Comprobaciones negativas con roles reales en PostgreSQL desechable.
-- La sesión postgres configura los roles; no se usan datos de producción.
do $$
begin
  if has_table_privilege('anon','public.stock_receipt_requests','SELECT') then
    raise exception 'anon tiene permiso SELECT';
  end if;
end $$;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select set_config('request.jwt.claims','{"email":"aihxo.camisetas@gmail.com"}',true);
do $$
declare blocked boolean:=false;
begin
  begin
    insert into public.stock_receipt_requests(request_id,actor_id,payload_hash)
    values ('cccccccc-0000-4000-8000-000000000001',
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',repeat('c',64));
  exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'authenticated pudo insertar en el ledger'; end if;
end $$;
do $$
declare blocked boolean:=false;
begin
  begin
    update public.stock_receipt_requests set payload_hash=repeat('f',64)
    where request_id='aaaaaaaa-0000-4000-8000-000000000001';
  exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'authenticated pudo alterar una recepción'; end if;
end $$;
rollback;

-- Un intento anónimo debe fallar por ausencia de SELECT, incluso si conoce UUID.
begin;
set local role anon;
do $$
declare blocked boolean:=false;
begin
  begin
    perform 1 from public.stock_receipt_requests
    where request_id='aaaaaaaa-0000-4000-8000-000000000001';
  exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'anon pudo consultar el ledger'; end if;
end $$;
rollback;

do $$
begin
  if exists(select 1 from public.stock_receipt_requests
            where request_id='cccccccc-0000-4000-8000-000000000001') then
    raise exception 'Una operación denegada dejó registros';
  end if;
  if exists(select 1 from public.stock_receipt_requests
            where request_id='aaaaaaaa-0000-4000-8000-000000000001'
              and payload_hash<>repeat('a',64)) then
    raise exception 'Una operación denegada alteró el registro';
  end if;
  raise notice 'PASS: escrituras directas y lectura anon bloqueadas';
end $$;
