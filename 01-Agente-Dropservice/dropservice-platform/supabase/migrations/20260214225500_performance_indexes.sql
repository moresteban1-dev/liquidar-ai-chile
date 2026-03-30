
-- Performance Indexes Migration
-- Target: Optimize lookups by status, role, and foreign keys.

-- 1. Orders & Quotations (Status heavy filtering)
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_provider_id ON public.quotations(provider_id);
CREATE INDEX IF NOT EXISTS idx_quotations_client_id ON public.quotations(client_id);

-- 2. Profiles (Role based access)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. Services (Category filtering)
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);

-- 4. Conversations (Chat history lookups)
CREATE INDEX IF NOT EXISTS idx_conversations_order_id ON public.conversations(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
