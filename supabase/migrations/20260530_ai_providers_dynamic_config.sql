-- ============================================================
-- MIGRACIÓN: Configuración Dinámica de Proveedores de IA
-- Fecha: 2026-05-30
-- Descripción: Tabla y políticas para OpenAI, Gemini, Claude, Perplexity y Groq
-- ============================================================

-- 1. TABLA: ai_providers
CREATE TABLE IF NOT EXISTS public.ai_providers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  slug          VARCHAR(50) UNIQUE NOT NULL,
  is_active     BOOLEAN DEFAULT false,
  api_key       TEXT, -- Clave de API encriptada en el backend
  default_model VARCHAR(100),
  custom_config JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Seeds de proveedores de IA por defecto
INSERT INTO public.ai_providers (name, slug, default_model, is_active)
VALUES
  ('Google Gemini', 'gemini', 'gemini-1.5-pro', true),
  ('OpenAI', 'openai', 'gpt-4o-mini', false),
  ('Anthropic Claude', 'claude', 'claude-3-5-sonnet-20241022', false),
  ('Perplexity AI', 'perplexity', 'sonar-medium-online', false),
  ('Groq Cloud', 'groq', 'llama3-70b-8192', false)
ON CONFLICT (slug) DO NOTHING;

-- 3. Trigger para updated_at
DROP TRIGGER IF EXISTS trg_ai_providers_updated ON ai_providers;
CREATE TRIGGER trg_ai_providers_updated
  BEFORE UPDATE ON ai_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

-- Policies: ai_providers
DROP POLICY IF EXISTS "Public can view active AI providers" ON ai_providers;
CREATE POLICY "Public can view active AI providers"
  ON ai_providers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can modify AI providers" ON ai_providers;
CREATE POLICY "Admins can modify AI providers"
  ON ai_providers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role = 'ADMIN' OR role = 'admin')
    )
  );
