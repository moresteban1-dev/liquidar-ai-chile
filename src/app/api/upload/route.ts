import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { withAuth } from '@/lib/api/with-auth';

let _supabaseClient: ReturnType<typeof createClient> | null = null;

const DEFAULT_SUPABASE_URL = 'https://bxhlusdpmjldqbsdztyg.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aGx1c2RwbWpsZHFic2R6dHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzc0NzQsImV4cCI6MjA4NTYxMzQ3NH0.v9MrG2kIDmQ_Kf3NJ-1l2Em99u2NrsOb8_fBh18eIgA';

function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  _supabaseClient = createClient(supabaseUrl, supabaseKey);
  return _supabaseClient;
}

export const POST = withAuth(async (request, _user) => {
  try {
    const supabase = getSupabaseClient();
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/webp', 
      'image/jpg', 
      'image/gif', 
      'image/svg+xml', 
      'video/mp4', 
      'video/webm', 
      'video/quicktime', 
      'application/pdf'
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido.' },
        { status: 400 }
      );
    }

    // Validar tamaño (10MB máximo)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo de 10MB' },
        { status: 400 }
      );
    }

    // Generar nombre único
    const fileExt = file.name.split('.').pop() || '';
    const safeName = file.name.replace(/[^a-zA-Z0-9]/g, '_').split('.')[0];
    const fileName = `${Date.now()}-${safeName}.${fileExt}`;
    const filePath = `catalog/${fileName}`;

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Supabase Storage
    const { error } = await supabase.storage
      .from('media')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      logger.error('Error de Supabase Storage en upload:', error);
      throw error;
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return NextResponse.json({ 
      url: publicUrl,
      fileName: fileName,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    logger.error('Error in /api/upload POST:', error);
    return NextResponse.json(
      { error: 'Error al subir archivo' },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (request, _user) => {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'No se proporcionó ruta de archivo' },
        { status: 400 }
      );
    }

    const { error } = await supabase.storage
      .from('media')
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in /api/upload DELETE:', error);
    return NextResponse.json(
      { error: 'Error al eliminar archivo' },
      { status: 500 }
    );
  }
});
