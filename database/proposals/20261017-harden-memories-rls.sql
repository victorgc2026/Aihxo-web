-- AIHXO security hardening proposal. NOT applied to production.
-- Restricts memories, memory_files and memory-files storage to the two
-- existing team identities used by the current order and stock policies.
-- Review authorised accounts and backup before applying.
begin;
-- Preflight: refuse to proceed if the current policy set differs from the audited one.
DO $
DECLARE public_count integer; storage_count integer;
BEGIN
 SELECT count(*) INTO public_count FROM pg_policies
 WHERE schemaname='public' AND tablename IN ('memories','memory_files')
 AND policyname LIKE '%_authenticated_%';
 SELECT count(*) INTO storage_count FROM pg_policies
 WHERE schemaname='storage' AND tablename='objects'
 AND policyname LIKE 'memory_storage_authenticated_%';
 IF public_count <> 8 OR storage_count <> 4 THEN
   RAISE EXCEPTION 'AIHXO Memories policy preflight failed: public %, storage % (expected 8,4)', public_count, storage_count;
 END IF;
END $;
do $
declare
  p record;
begin
  for p in
    select policyname, tablename
    from pg_policies
    where schemaname='public'
      and tablename in ('memories','memory_files')
      and policyname like '%_authenticated_%'
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
  for p in
    select policyname
    from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname like 'memory_storage_authenticated_%'
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;
create policy aihxo_team_memories on public.memories
  for all to authenticated
  using (lower(coalesce(auth.jwt()->>'email','')) = any(array['aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com']))
  with check (lower(coalesce(auth.jwt()->>'email','')) = any(array['aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com']));
create policy aihxo_team_memory_files on public.memory_files
  for all to authenticated
  using (lower(coalesce(auth.jwt()->>'email','')) = any(array['aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com']))
  with check (lower(coalesce(auth.jwt()->>'email','')) = any(array['aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com']));
create policy aihxo_team_memory_storage on storage.objects
  for all to authenticated
  using (bucket_id='memory-files' and lower(coalesce(auth.jwt()->>'email','')) = any(array['aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com']))
  with check (bucket_id='memory-files' and lower(coalesce(auth.jwt()->>'email','')) = any(array['aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com']));
commit;
