-- AIHXO: prueba efectiva de RLS, solo en base de ensayo.
-- El propietario postgres crea los datos; los roles API solo consultan.
insert into public.stock_receipt_requests(request_id,actor_id,payload_hash,result,completed_at)
values
('aaaaaaaa-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',repeat('a',64),'{"ok":true}'::jsonb,now()),
('aaaaaaaa-0000-4000-8000-000000000002','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',repeat('b',64),'{"ok":true}'::jsonb,now());

grant usage on schema public to anon, authenticated;

do $$
declare n int;
begin
  -- Esta sección verifica el fixture; los SET ROLE se ejecutan por separado.
  select count(*) into n from public.stock_receipt_requests;
  if n<>2 then raise exception 'Fixture incompleto'; end if;
end;
$$;
