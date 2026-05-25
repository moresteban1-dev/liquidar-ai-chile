'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface ExcelDropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  isLoading?: boolean;
  className?: string;
}

export function ExcelDropZone({
  onFileSelect,
  accept = '.xlsx,.xls,.csv',
  maxSizeMB = 10,
  isLoading = false,
  className
}: ExcelDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndProcessFile = (selectedFile: File) => {
    setError(null);
    
    // Validate size
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`El archivo supera el tamaño máximo permitido (${maxSizeMB}MB)`);
      return;
    }

    // Validate extension
    const validExtensions = accept.split(',').map(ext => ext.trim());
    const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError(`Formato no válido. Soportados: ${accept}`);
      return;
    }

    setFile(selectedFile);
    onFileSelect(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const firstFile = e.dataTransfer.files[0];
      if (firstFile) validateAndProcessFile(firstFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const firstFile = e.target.files[0];
      if (firstFile) validateAndProcessFile(firstFile);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed p-8 transition-all duration-200 text-center cursor-pointer",
          isDragging 
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10" 
            : error 
              ? "border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10"
              : file 
                ? "border-green-300 bg-green-50 dark:border-green-900/50 dark:bg-green-900/10"
                : "border-border hover:border-indigo-400 hover:bg-muted/50",
          isLoading && "pointer-events-none opacity-80"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <FileSpreadsheet className="h-10 w-10 text-indigo-500 mb-4 animate-pulse" />
            <h3 className="text-sm font-medium mb-2">Procesando archivo...</h3>
            <Progress value={undefined} className="w-48 h-2" />
          </div>
        ) : file && !error ? (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{file.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB • Haz clic para cambiar
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <div className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center mb-3",
              error ? "bg-red-100 dark:bg-red-900/30" : "bg-indigo-100 dark:bg-indigo-900/30"
            )}>
              {error ? (
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              ) : (
                <Upload className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
            
            <h3 className={cn("text-sm font-semibold mb-1", error ? "text-red-600 dark:text-red-400" : "text-foreground")}>
              {error || 'Arrastra tu archivo aquí o haz clic para seleccionar'}
            </h3>
            
            {!error && (
              <p className="text-xs text-muted-foreground mt-1">
                Formatos soportados: {accept} (Máx {maxSizeMB}MB)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
