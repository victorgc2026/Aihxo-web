do $$
begin
  if has_table_privilege('authenticated','public.stock_receipt_requests','INSERT')
     or has_table_privilege('authenticated','public.stock_receipt_requests','UPDATE')
     or has_table_privilege('anon','public.stock_receipt_requests','SELECT')
     or has_table_privilege('anon','public.stock_receipt_requests','INSERT') then
    raise exception 'Permisos directos inseguros en registro de recepciones';
  end if;
  if not has_table_privilege('authenticated','public.stock_receipt_requests','SELECT') then
    raise exception 'El equipo no puede consultar sus solicitudes';
  end if;
  if not (select relrowsecurity from pg_class where oid='public.stock_receipt_requests'::regclass) then
    raise exception 'RLS deshabilitado';
  end if;
  raise notice 'PASS: ledger RLS enabled, no direct writes for authenticated/anon';
end;
$$;
