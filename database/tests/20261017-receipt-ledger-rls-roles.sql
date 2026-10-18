-- Ejecutar con psql -v ON_ERROR_STOP=1 en PostgreSQL desechable.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select set_config('request.jwt.claims','{"email":"aihxo.camisetas@gmail.com"}',true);
do $$
declare n integer;
begin
  select count(*) into n from public.stock_receipt_requests;
  if n<>1 then raise exception 'Miembro equipo esperaba 1 registro, obtuvo %',n; end if;
end $$;
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select set_config('request.jwt.claims','{"email":"usuario.externo@example.com"}',true);
do $$
declare n integer;
begin
  select count(*) into n from public.stock_receipt_requests;
  if n<>0 then raise exception 'Usuario externo puede consultar % registros',n; end if;
end $$;
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
select set_config('request.jwt.claims','{"email":"gracielaoliveros.go@gmail.com"}',true);
do $$
declare n integer;
begin
  select count(*) into n from public.stock_receipt_requests;
  if n<>1 then raise exception 'Segundo miembro equipo esperaba 1 registro, obtuvo %',n; end if;
end $$;
rollback;
