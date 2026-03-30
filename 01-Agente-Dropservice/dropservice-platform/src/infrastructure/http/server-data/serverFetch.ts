import { getSupabaseServerClient } from '@/infrastructure/persistence/supabase/SupabaseClient';
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger';
import { metricsCollector } from '@/infrastructure/telemetry/MetricsCollector';
import { createClient } from '@/lib/supabase/server';
import { UserRole } from '@/core/domain/auth/UserRole';

/**
 * Server-side data fetching functions for Server Components.
 * These run on the server and return data directly into the RSC tree.
 * No API calls needed — direct DB access via Supabase server client.
 */

const logger = StructuredLogger.create({ component: 'server-fetch' });

// ═══════════════════════════════════════════════════════════
// Shared Types
// ═══════════════════════════════════════════════════════════

export interface InventoryStats {
  totalItems: number;
  availableItems: number;
  totalValue: number;
  averageCost: number;
}

// ═══════════════════════════════════════════════════════════
// Order Fetchers
// ═══════════════════════════════════════════════════════════

export interface OrderListParams {
  readonly userId: string;
  readonly role: UserRole;
  readonly page?: number;
  readonly limit?: number;
  readonly status?: string | undefined;
  readonly search?: string | undefined;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
}

export interface OrderListData {
  readonly orders: OrderSummary[];
  readonly total: number;
  readonly page: number;
  readonly totalPages: number;
}

export interface OrderSummary {
  readonly id: string;
  readonly title: string;
  readonly eventType: string;
  readonly eventDate: string;
  readonly state: string;
  readonly urgency: string;
  readonly estimatedBudget: number | null;
  readonly currency: string;
  readonly guestCount: number | null;
  readonly createdAt: string;
  readonly clientName: string | null;
  readonly providerName: string | null;
  readonly quotationCount: number;
  readonly latestQuotationPrice: number | null;
}

export async function fetchOrders(params: OrderListParams): Promise<OrderListData> {
  const startTime = Date.now();
  const {
    userId,
    role,
    page = 1,
    limit = 20,
    status,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = params;

  const supabase = await getSupabaseServerClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('orders')
    .select(
      `
      id, title, event_type, event_date, state, urgency,
      estimated_budget, budget_currency, guest_count, created_at,
      client:profiles!orders_client_id_fkey(full_name),
      provider:profiles!orders_provider_id_fkey(full_name),
      quotations(id, client_price)
    `,
      { count: 'exact' },
    )
    .is('deleted_at', null);

  // Role-based filtering
  if (role === UserRole.CLIENT) {
    query = query.eq('client_id', userId);
  } else if (role === UserRole.VENDOR) {
    query = query.eq('provider_id', userId);
  }

  if (status) query = query.eq('state', status);
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

  const validColumns = ['created_at', 'updated_at', 'event_date', 'title', 'state'];
  const safeSortBy = validColumns.includes(sortBy) ? sortBy : 'created_at';

  query = query
    .order(safeSortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  metricsCollector.recordHistogram(
    'server_fetch.orders.duration_ms',
    Date.now() - startTime,
    { role },
  );

  if (error) {
    logger.error('Error fetching orders:', error.message, { role, userId });
    return { orders: [], total: 0, page, totalPages: 0 };
  }

  const orders: OrderSummary[] = (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    eventType: row.event_type,
    eventDate: row.event_date,
    state: row.state,
    urgency: row.urgency,
    estimatedBudget: row.estimated_budget,
    currency: row.budget_currency ?? 'MXN',
    guestCount: row.guest_count,
    createdAt: row.created_at,
    clientName: row.client?.full_name ?? null,
    providerName: row.provider?.full_name ?? null,
    quotationCount: row.quotations?.length ?? 0,
    latestQuotationPrice: row.quotations?.[0]?.client_price ?? null,
  }));

  const total = count ?? 0;

  return {
    orders,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ═══════════════════════════════════════════════════════════
// Order Detail Fetcher
// ═══════════════════════════════════════════════════════════

export interface OrderDetailData {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly eventType: string;
  readonly eventDate: string;
  readonly state: string;
  readonly urgency: string;
  readonly estimatedBudget: number | null;
  readonly currency: string;
  readonly guestCount: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly client: { id: string; name: string; email: string } | null;
  readonly provider: { id: string; name: string; company: string | null } | null;
  readonly quotations: QuotationSummary[];
}

export interface QuotationSummary {
  readonly id: string;
  readonly status: string;
  readonly providerCost: number;
  readonly adminMargin: number;
  readonly clientPrice: number;
  readonly currency: string;
  readonly items: any[];
  readonly notes: string | null;
  readonly validUntil: string | null;
  readonly createdAt: string;
}

export async function fetchOrderDetail(
  orderId: string,
  userRole: UserRole,
): Promise<OrderDetailData | null> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      client:profiles!orders_client_id_fkey(id, full_name, email),
      provider:profiles!orders_provider_id_fkey(id, full_name, company_name),
      quotations(
        id, status, provider_cost, admin_margin, client_price,
        currency, items, notes, valid_until, created_at
      )
    `,
    )
    .eq('id', orderId)
    .is('deleted_at', null)
    .single();

  if (error || !data) return null;

  const clientData = data.client as any;
  const providerData = data.provider as any;
  const quotationsData = (data.quotations ?? []) as any[];

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    eventType: data.event_type,
    eventDate: data.event_date,
    state: data.state,
    urgency: data.urgency,
    estimatedBudget: data.estimated_budget,
    currency: data.budget_currency ?? 'MXN',
    guestCount: data.guest_count,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    client: clientData
      ? { id: clientData.id, name: clientData.full_name, email: clientData.email }
      : null,
    provider: providerData
      ? { id: providerData.id, name: providerData.full_name, company: providerData.company_name }
      : null,
    quotations: quotationsData.map((q) => ({
      id: q.id,
      status: q.status,
      providerCost: userRole === UserRole.ADMIN ? q.provider_cost : 0,
      adminMargin: userRole === UserRole.ADMIN ? q.admin_margin : 0,
      clientPrice: userRole !== UserRole.VENDOR ? q.client_price : 0,
      currency: q.currency ?? 'MXN',
      items: q.items ?? [],
      notes: q.notes,
      validUntil: q.valid_until,
      createdAt: q.created_at,
    })),
  };
}

// ═══════════════════════════════════════════════════════════
// Dashboard Stats Fetcher
// ═══════════════════════════════════════════════════════════

export interface DashboardData {
  readonly totalOrders: number;
  readonly byStatus: Record<string, number>;
  readonly totalRevenue: number;
  readonly totalProfit: number;
  readonly avgOrderValue: number;
  readonly recentOrders: number;
  readonly pendingQuotations: number;
  readonly activeProviders: number;
}

export async function fetchDashboardStats(): Promise<DashboardData> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.rpc('get_dashboard_stats');

  if (error) {
    logger.error('fetchDashboardStats failed', { error: error.message });
    return {
      totalOrders: 0,
      byStatus: {},
      totalRevenue: 0,
      totalProfit: 0,
      avgOrderValue: 0,
      recentOrders: 0,
      pendingQuotations: 0,
      activeProviders: 0,
    };
  }

  return data as DashboardData;
}

// ═══════════════════════════════════════════════════════════
// Quotation Fetchers (Sprint 4 - Day 5 Migration)
// ═══════════════════════════════════════════════════════════

export interface QuotationListData {
  readonly id: string;
  readonly code: string;
  readonly brief: string;
  readonly status: string;
  readonly publicStatus: string;
  readonly priceCost: number | null;
  readonly priceTotal: number | null;
  readonly createdAt: string;
  readonly serviceName: string;
  readonly clientName: string | null;
  readonly providerName: string | null;
  readonly eventStartDate: string | null;
  readonly eventLocation: string | null;
  readonly eventAddress: string | null;
  readonly eventTime: string | null;
  readonly setupTime: string | null;
  readonly teardownTime: string | null;
  readonly eventEndTime: string | null;
  readonly technicalVisit: boolean;
}

export async function fetchAdminQuotations(): Promise<QuotationListData[]> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from('quotations')
    .select(`
      id, code, brief, status, public_status, price_cost, price_total, created_at,
      service:services(name),
      client:profiles!quotations_client_id_fkey(full_name),
      provider:profiles!quotations_assigned_provider_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false });

  if (error || !data) {
    logger.error('Error fetching admin quotations:', error?.message);
    return [];
  }

  return data.map((q: any) => ({
    id: q.id,
    code: q.code,
    brief: q.brief || '',
    status: q.status,
    publicStatus: q.public_status || q.status,
    priceCost: q.price_cost,
    priceTotal: q.price_total,
    createdAt: q.created_at,
    serviceName: q.service?.name || 'Servicio General',
    clientName: q.client?.full_name || null,
    providerName: q.provider?.full_name || null,
    eventStartDate: null,
    eventLocation: null,
    eventAddress: null,
    eventTime: null,
    setupTime: null,
    teardownTime: null,
    eventEndTime: null,
    technicalVisit: false,
  }));
}

export async function fetchProviderQuotations(providerId: string): Promise<QuotationListData[]> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from('quotations')
    .select(`
      id, code, brief, status, public_status, price_cost, created_at,
      service:services(name),
      client:profiles!quotations_client_id_fkey(full_name),
      event_start_date, event_location, event_address, event_time,
      setup_time, teardown_time, event_end_time, technical_visit
    `)
    .eq('assigned_provider_id', providerId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    logger.error('Error fetching provider quotations:', error?.message, { providerId });
    return [];
  }

  return data.map((q: any) => ({
    id: q.id,
    code: q.code,
    brief: q.brief || '',
    status: q.status,
    publicStatus: q.public_status || q.status,
    priceCost: q.price_cost,
    priceTotal: null,
    createdAt: q.created_at,
    serviceName: q.service?.name || 'Servicio General',
    clientName: q.client?.full_name || null,
    providerName: null,
    eventStartDate: q.event_start_date,
    eventLocation: q.event_location,
    eventAddress: q.event_address,
    eventTime: q.event_time,
    setupTime: q.setup_time,
    teardownTime: q.teardown_time,
    eventEndTime: q.event_end_time,
    technicalVisit: q.technical_visit || false,
  }));
}

// ═══════════════════════════════════════════════════════════
// Inventory Fetchers
// ═══════════════════════════════════════════════════════════

export async function fetchProviderProfileByUserId(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('provider_profiles')
    .select('id, company_name')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function fetchProviderInventory(providerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('provider_inventory')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching provider inventory:', error.message);
    return [];
  }
  return data;
}

export async function fetchInventoryStats(providerId: string): Promise<InventoryStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('provider_inventory')
    .select('is_available, cost_per_unit')
    .eq('provider_id', providerId);

  if (error || !data) {
    return { totalItems: 0, availableItems: 0, totalValue: 0, averageCost: 0 };
  }

  const totalValue = data.reduce((acc, curr) => acc + (curr.cost_per_unit || 0), 0);
  return {
    totalItems: data.length,
    availableItems: data.filter(i => i.is_available).length,
    totalValue,
    averageCost: data.length > 0 ? totalValue / data.length : 0
  };
}

export async function fetchCatalogForInventory() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('catalog_items')
    .select(`
      id,
      name,
      item_type,
      price_suggested,
      price_reference_min,
      price_reference_max,
      unit_label,
      catalog_categories (
        name
      )
    `)
    .eq('status', 'ACTIVE')
    .order('name');

  if (error) {
    logger.error('Error fetching catalog for inventory:', error.message);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    name: item.name,
    itemType: item.item_type,
    priceSuggested: item.price_suggested,
    priceReferenceMin: item.price_reference_min,
    priceReferenceMax: item.price_reference_max,
    unitLabel: item.unit_label,
    categoryName: (item.catalog_categories as any)?.name || 'Sin categoría'
  }));
}

// ═══════════════════════════════════════════════════════════
// Quotation Detail & History Fetchers
// ═══════════════════════════════════════════════════════════

export async function fetchQuotationDetail(id: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('quotations')
    .select(`
      *,
      client:profiles!quotations_client_id_fkey(id, name, email, phone),
      assigned_provider:profiles!quotations_assigned_provider_id_fkey(id, name, email),
      service:services(id, name, price_from),
      category:categories(id, name)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    logger.error('Error fetching quotation detail:', error?.message, { id });
    return null;
  }

  return data;
}

export async function fetchQuotationHistory(quotationId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('quotation_history')
    .select('*')
    .eq('quotation_id', quotationId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching quotation history:', error.message, { quotationId });
    return [];
  }

  return data.map((h: any) => ({
    id: h.id,
    quotationId: h.quotation_id,
    previousStatus: h.previous_status,
    newStatus: h.new_status,
    actorId: h.actor_id,
    actorType: h.actor_type,
    comment: h.comment,
    createdAt: h.created_at,
  }));
}

export async function fetchQuotationProviderItems(quotationId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('quotation_provider_items')
    .select('*')
    .eq('quotation_id', quotationId)
    .order('sort_order', { ascending: true });

  if (error) {
    logger.error('Error fetching quotation provider items:', error.message, { quotationId });
    return [];
  }

  return data;
}
