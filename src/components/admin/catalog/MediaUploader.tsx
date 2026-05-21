'use client';

import { useState } from 'react';
import { Upload, X, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
// [REMOVED] r
import { MediaAsset } from '@core/domain/catalog/CatalogTypes';
import Image from 'next/image';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

interface MediaUploaderProps {
  value: MediaAsset[];
  onChange: (assets: MediaAsset[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  label?: string;
}

export function MediaUploader({ 
  value = [], 
  onChange, 
  maxFiles = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/jpg'],
  label = 'Imágenes'
}: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    // Convert FileList to Array for safer processing
    const files = Array.from(fileList);

    // Validar cantidad máxima
    if (value.length + files.length > maxFiles) {
      alert(`Solo puedes subir un máximo de ${maxFiles} archivos`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedAssets: MediaAsset[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        
        // Validar tipo robustamente con fallback por extensión
        const fileTypeLower = file.type.toLowerCase();
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
        
        let isAllowed = acceptedTypes.some(t => t.toLowerCase() === fileTypeLower);
        if (!isAllowed) {
          if (acceptedTypes.some(t => t.startsWith('video/')) && videoExtensions.includes(ext)) {
            isAllowed = true;
          } else if (acceptedTypes.some(t => t.startsWith('image/')) && imageExtensions.includes(ext)) {
            isAllowed = true;
          }
        }

        if (!isAllowed) {
          logger.warn(`Archivo ${file.name} ignorado: tipo no permitido (${file.type || 'desconocido'})`);
          alert(`El archivo ${file.name} no es de un tipo permitido.`);
          continue;
        }

        // Validar tamaño (10MB máximo)
        if (file.size > 10 * 1024 * 1024) {
          logger.warn(`Archivo ${file.name} ignorado: tamaño excede 10MB`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al subir archivo');
        }

        const { url, type } = await response.json();

        // Determinar el tipo (image, video, document)
        let assetType: 'image' | 'video' | 'document' = 'document';
        if (type.startsWith('image/')) assetType = 'image';
        if (type.startsWith('video/')) assetType = 'video';

        uploadedAssets.push({
          url: url as string,
          type: assetType,
          altText: file.name.replace(/\.[^/.]+$/, ''), // Nombre sin extensión
          order: value.length + i,
        });

        // Actualizar progreso
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      if (uploadedAssets.length > 0) {
        onChange([...value, ...uploadedAssets]);
      }

    } catch (error) {
      logger.error('Error subiendo archivos:', error);
      alert(error instanceof Error ? error.message : 'Error al subir medios');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Resetear el input
      e.target.value = '';
    }
  };

  const removeAsset = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateAltText = (index: number, altText: string) => {
    const asset = value[index];
    if (!asset) return;

    const updated = [...value];
    updated[index] = { ...asset, altText };
    onChange(updated);
  };

  const moveAsset = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= value.length) return;

    const updated = [...value];
    const itemA = updated[index];
    const itemB = updated[newIndex];

    if (itemA !== undefined && itemB !== undefined) {
      updated[index] = itemB;
      updated[newIndex] = itemA;
      
      // Actualizar orden
      updated.forEach((asset, i) => {
        asset.order = i;
      });

      onChange(updated);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {label} ({value.length}/{maxFiles})
      </label>

      {/* Grid de imágenes */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {value.map((asset, index) => (
            <div key={index} className="relative group bg-gray-50 p-2 rounded-lg border">
              <div className="aspect-square relative overflow-hidden rounded-md bg-gray-100 flex items-center justify-center">
                {asset.type === 'video' || (asset.type as string) === 'VIDEO' ? (
                  <div className="relative w-full h-full">
                    <video 
                      src={asset.url} 
                      className="w-full h-full object-cover" 
                      controls={false}
                      preload="metadata"
                      playsInline
                      muted 
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/45 transition-colors">
                      <span className="text-white bg-black/60 p-2 rounded-full shadow-md group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                ) : (asset.type === 'image' || (asset.type as string) === 'IMAGE') ? (
                  <Image
                    src={asset.url}
                    alt={asset.altText || `Media ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-xs text-center border p-2">Documento</div>
                )}
              </div>

              {/* Controles */}
              <div className="absolute top-4 right-4 flex gap-1 bg-white/80 p-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {index > 0 && (
                  <button
                    type="button"
                    className="p-1 hover:bg-gray-200 rounded"
                    onClick={() => moveAsset(index, 'up')}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                )}
                {index < value.length - 1 && (
                  <button
                    type="button"
                    className="p-1 hover:bg-gray-200 rounded"
                    onClick={() => moveAsset(index, 'down')}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  className="p-1 hover:bg-red-100 text-red-600 rounded"
                  onClick={() => removeAsset(index)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Input de texto alternativo */}
              <input
                type="text"
                placeholder="Texto alt (se usa de pie de foto)"
                value={asset.altText || ''}
                onChange={(e) => updateAltText(index, e.target.value)}
                className="mt-2 text-xs w-full bg-transparent border-b focus:outline-none focus:border-black p-1"
              />

              {/* Badge de orden */}
              <div className="absolute top-4 left-4 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded shadow">
                #{index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Área de subida */}
      {value.length < maxFiles && (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 mb-2 text-gray-400 animate-spin" />
                <p className="text-sm text-gray-500">
                  Subiendo... {Math.round(uploadProgress)}%
                </p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">
                  Click para subir archivos
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Máximo {maxFiles} archivos de hasta 10MB
                </p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
}
