-- HPC Optimization: Create RPC function for O(1) KPI retrieval
-- Prevents "Select All" RAM Aggregation in Node.js

create or replace function get_admin_kpis()
returns json
language plpgsql
security definer
as $$
declare
  total_revenue numeric;
  total_margin numeric;
  active_orders_count bigint;
  pending_quotes_count bigint;
begin
  -- 1. Revenue & Margin (Single Pass)
  select 
    coalesce(sum(total_client_price), 0),
    coalesce(sum(admin_fee), 0)
  into 
    total_revenue,
    total_margin
  from quotations
  where public_status in ('PAGADA', 'EN_PRODUCCION', 'ENTREGADA', 'FINALIZADA');

  -- 2. Active Orders
  select count(*)
  into active_orders_count
  from quotations
  where public_status in ('PAGADA', 'EN_PRODUCCION', 'EN_DESPACHO');

  -- 3. Pending Quotes
  select count(*)
  into pending_quotes_count
  from quotations
  where public_status in ('SOLICITADA', 'EN_REVISION');

  -- Return JSON
  return json_build_object(
    'revenue', total_revenue,
    'margin', total_margin,
    'orders', active_orders_count,
    'quotes', pending_quotes_count
  );
end;
$$;
