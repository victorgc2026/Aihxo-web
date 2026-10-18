-- AIHXO security hardening proposal. NOT applied to production.
-- Restricts memories, memory_files and memory-files storage to the two
-- existing team identities used by the current order and stock policies.
-- Review authorised accounts and backup before applying.
begin;
drop policy if exists memories_authenticated_delete on public.memories;
drop policy if exists memories_authenticated_insert on public.memories;
drop policy if exists memories_authenticated_select on public.memories;
drop policy if exists memories_authenticated_update on public.memories;
drop policy if exists memory_files_authenticated_delete on public.memory_files;
drop policy if exists memory_files_authenticated_insert on public.memory_files;
drop policy if exists memory_files_authenticated_select on public.memory_files;
drop policy if exists memory_files_authenticated_update on public.memory_files;
drop policy if exists memory_storage_authenticated_delete on storage.objects;
drop policy if exists memory_storage_authenticated_insert on storage.objects;
drop policy if exists memory_storage_authenticated_select on storage.objects;
drop policy if exists memory_storage_authenticated_update on storage.objects;
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
