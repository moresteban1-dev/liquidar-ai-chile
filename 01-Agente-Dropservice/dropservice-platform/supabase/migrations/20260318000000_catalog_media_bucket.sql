-- Migration: Crear bucket de storage y políticas
-- Ejecutar en Supabase SQL Editor o via supabase migration up

-- 1. Crear bucket 'media' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Política: Permitir lectura pública
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- 3. Política: Permitir subida autenticada (o Service Role en nuestro caso via API proxy)
CREATE POLICY "Authenticated upload access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

-- 4. Política: Permitir eliminación autenticada
CREATE POLICY "Authenticated delete access"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

-- 5. Asegurar que la tabla catalog_items tenga las columnas necesarias (ya deberían existir pero por seguridad)
ALTER TABLE catalog_items
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS technical_specs JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 6. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_catalog_items_status ON catalog_items(status);
CREATE INDEX IF NOT EXISTS idx_catalog_items_type ON catalog_items(type);
CREATE INDEX IF NOT EXISTS idx_catalog_items_category ON catalog_items(category_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_featured ON catalog_items(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_catalog_items_slug ON catalog_items(slug);

-- 7. Trigger para auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_catalog_items_updated_at ON catalog_items;
CREATE TRIGGER update_catalog_items_updated_at 
BEFORE UPDATE ON catalog_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
