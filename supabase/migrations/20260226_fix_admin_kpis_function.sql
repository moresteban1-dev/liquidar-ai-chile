-- ============================================
-- FIX: Update get_admin_kpis with business-aligned status buckets
-- ============================================

CREATE OR REPLACE FUNCTION get_admin_kpis()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_revenue numeric;
  total_margin numeric;
  active_orders_count bigint;
  pending_quotes_count bigint;
BEGIN
  -- 1. Revenue & Margin: Finalized/Paid business
  SELECT 
    COALESCE(SUM(total_client_price), 0),
    COALESCE(SUM(total_commission_net), 0)
  INTO 
    total_revenue,
    total_margin
  FROM quotations
  WHERE status IN ('PAID', 'FULFILLED');

  -- 2. Active Orders (Business in final pipeline): Quoted, Approved or Paid
  SELECT COUNT(*)
  INTO active_orders_count
  FROM quotations
  WHERE status IN ('AWAITING_CLIENT_PAYMENT', 'APPROVED', 'PAID');

  -- 3. Pending Quotes (Beginning/Middle of pipeline): Reviewing, Bidding or Assigning
  SELECT COUNT(*)
  INTO pending_quotes_count
  FROM quotations
  WHERE status IN ('PENDING_ASSIGNMENT', 'PENDING_PROVIDER_BID', 'PENDING_ADMIN_APPROVAL');

  RETURN json_build_object(
    'revenue', total_revenue,
    'margin', total_margin,
    'orders', active_orders_count,
    'quotes', pending_quotes_count
  );
END;
$$;
