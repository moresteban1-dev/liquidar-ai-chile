/** Tipo de plantilla de importación */
export type TemplateType = 'prospects' | 'suppliers' | 'companies' | 'contacts' | 'custom';

/** Estrategia de deduplicación */
export type DeduplicationStrategy = 'email' | 'phone' | 'name-and-company' | 'none';

/** Estado de un registro importado */
export type ImportedRecordStatus = 'raw' | 'enriched' | 'validated' | 'error' | 'duplicate';

/** Mapeo de columna Excel a campo del sistema */
export interface ColumnMapping {
  excelColumn: string;
  systemField: string;
  isRequired: boolean;
  transform?: 'uppercase' | 'lowercase' | 'trim' | 'phone-format' | 'email-normalize';
}

/** Configuración de importación */
export interface ExcelImportConfig {
  templateType: TemplateType;
  columnMapping: ColumnMapping[];
  deduplicationStrategy: DeduplicationStrategy;
  enrichWithAI: boolean;
  skipHeaderRows: number;
  maxRows?: number;
}

/** Error de validación de fila */
export interface RowValidationError {
  row: number;
  column: string;
  value: string;
  error: string;
}

/** Resultado de importación */
export interface ImportResult {
  importId: string;
  fileName: string;
  templateType: TemplateType;
  totalRows: number;
  importedRows: number;
  duplicatesFound: number;
  errorsFound: number;
  validationErrors: RowValidationError[];
  enrichedFields: number;
  status: 'completed' | 'partial' | 'failed';
}

/** Preview de datos del Excel antes de importar */
export interface ExcelPreview {
  detectedColumns: string[];
  sampleRows: Record<string, string>[];
  totalRows: number;
  suggestedMapping: ColumnMapping[];
  suggestedTemplateType: TemplateType;
}
