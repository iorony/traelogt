alter table public.quote_requests add column if not exists final_price_guatemala numeric(12,2) check(final_price_guatemala>=0);
alter table public.quote_requests add column if not exists local_delivery_cost numeric(12,2) default 0 check(local_delivery_cost>=0);
alter table public.quote_requests add column if not exists customer_response text check(customer_response in('pending','accepted','rejected')) default 'pending';
alter table public.quote_requests add column if not exists responded_at timestamptz;
comment on column public.quote_requests.final_price_guatemala is 'Precio final comunicado al cliente por el producto ya importado y disponible en Guatemala.';
comment on column public.quote_requests.local_delivery_cost is 'Costo separado para entregar desde el punto de Tráelo GT en Guatemala hasta la dirección del cliente.';
comment on column public.quote_requests.total is 'Total final: final_price_guatemala más local_delivery_cost cuando corresponda.';
