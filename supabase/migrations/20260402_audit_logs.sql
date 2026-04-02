-- ============================================
-- Audit Logs Migration — Identity Fortress
-- ============================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    actor TEXT NOT NULL, -- user.id or 'anonymous'
    target TEXT, -- target resource or user.id
    ip_address INET,
    user_agent TEXT,
    severity TEXT DEFAULT 'LOW' 
        CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only Admins can view audit logs
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'ADMIN'
        )
    );

-- Nobody can update or delete audit logs
CREATE POLICY "No one can update audit logs" ON public.audit_logs
    FOR UPDATE USING (FALSE);

CREATE POLICY "No one can delete audit logs" ON public.audit_logs
    FOR DELETE USING (FALSE);

-- Only service role can insert (via backend)
CREATE POLICY "Service can insert audit logs" ON public.audit_logs
    FOR INSERT
    WITH CHECK (TRUE);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
