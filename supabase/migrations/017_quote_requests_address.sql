-- El formulario de cotización ahora pide una sola dirección opcional en vez de
-- departamento/municipio obligatorios. Se agrega la columna y se libera el "not null"
-- de las columnas antiguas para no romper las cotizaciones ya guardadas.
alter table public.quote_requests add column if not exists address text;
alter table public.quote_requests alter column department drop not null;
alter table public.quote_requests alter column municipality drop not null;
