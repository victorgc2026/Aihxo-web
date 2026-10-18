-- PROPUESTA DE DISEÑO — NO EJECUTAR EN PRODUCCIÓN
-- La RPC actual receive_stock_batch(p_items,p_purchase_id) debe conservarse
-- hasta probar la sustitución completa en un proyecto aislado.
--
-- 1. Registro persistente de solicitudes únicas
create table if not exists public.stock_receipt_requests (
  request_id uuid primary key,
  purchase_id uuid null references public.purchases(id),
  payload_hash text not null,
  result jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.stock_receipt_requests enable row level security;
-- Las políticas RLS y GRANT deben alinearse con los permisos administrativos
-- existentes antes de utilizar esta tabla. No activar la API sin esas políticas.
--
-- 2. Diseño obligatorio de una futura RPC receive_stock_batch_idempotent
--    (p_request_id uuid, p_items jsonb, p_purchase_id uuid):
--    a) validar identidad y permisos del equipo;
--    b) canonizar el payload y calcular hash determinista;
--    c) INSERT request_id ... ON CONFLICT DO NOTHING;
--    d) SELECT ... FOR UPDATE por request_id, con bloqueo de fila;
--    e) si existe completed_at, devolver result SOLO si hash coincide;
--    f) si el mismo request_id tiene otro hash, lanzar error;
--    g) procesar recepción y asignación EN LA MISMA TRANSACCIÓN;
--    h) guardar result/completed_at antes del commit;
--    i) devolver result al cliente.
--
-- IMPORTANTE: no llamar a la RPC antigua desde un wrapper que se confirme
-- por separado. El registro idempotente y los movimientos de stock deben
-- compartir una sola transacción. No exponer esta tabla a anon.
