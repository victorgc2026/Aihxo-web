-- AIHXO Gestión · personalización opcional de asa en diseños de tazas
-- Aplicar en el proyecto Supabase antes de usar el nuevo formulario.
alter table public.mug_designs
  add column if not exists handle_enabled boolean not null default false,
  add column if not exists handle_text text,
  add column if not exists handle_orientation text not null default 'vertical';

alter table public.mug_designs
  drop constraint if exists mug_designs_handle_text_valid;
alter table public.mug_designs
  add constraint mug_designs_handle_text_valid check (
    (handle_enabled = false and (handle_text is null or btrim(handle_text) = ''))
    or
    (handle_enabled = true and handle_text is not null
      and length(btrim(handle_text)) between 1 and 40
      and handle_orientation in ('vertical','horizontal'))
  );
comment on column public.mug_designs.handle_enabled is 'Solicita texto personalizado adicional en el asa de la taza';
comment on column public.mug_designs.handle_text is 'Nombre o frase corta que se imprimirá en el asa';
comment on column public.mug_designs.handle_orientation is 'Orientación solicitada del texto del asa';
