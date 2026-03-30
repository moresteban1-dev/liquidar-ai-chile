-- ============================================
-- MIGRATION: Client Documents
-- Stores uploaded documents associated with quotations.
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ============================================

CREATE TABLE IF NOT EXISTS public.client_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Owner and reference
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    quotation_id UUID,

    -- File metadata
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path VARCHAR(500) NOT NULL,

    -- Classification
    category VARCHAR(50) DEFAULT 'OTHER' CHECK (category IN (
        'CONTRACT',
        'INVOICE',
        'RECEIPT',
        'PERMIT',
        'LAYOUT',
        'PHOTO',
        'OTHER'
    )),

    -- Description
    description TEXT,

    -- Visibility
    uploaded_by VARCHAR(20) DEFAULT 'CLIENT' CHECK (uploaded_by IN ('CLIENT', 'ADMIN', 'SYSTEM')),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_client_documents_user
    ON public.client_documents(user_id);

CREATE INDEX IF NOT EXISTS idx_client_documents_quotation
    ON public.client_documents(quotation_id);

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own documents"
    ON public.client_documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
    ON public.client_documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);
