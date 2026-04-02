-- ============================================
-- Admin Invitations Migration — Identity Fortress
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique active invitation per email
    CONSTRAINT unique_active_invitation 
        UNIQUE (email, used) 
        WHERE (used = FALSE)
);

-- Enable RLS
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Only Admins can manage invitations
CREATE POLICY "Only admins can manage invitations" ON public.admin_invitations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'ADMIN'
        )
    );

-- Fast lookup index
CREATE INDEX IF NOT EXISTS idx_invitations_lookup 
    ON public.admin_invitations(email, token_hash, used, expires_at);
