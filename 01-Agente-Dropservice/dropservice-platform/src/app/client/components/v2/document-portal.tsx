/**
 * DocumentPortal — Server Component listing client documents.
 * Shows documents grouped by category with download links.
 */
import { createServiceRoleClient } from '@/lib/supabase/api';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, FolderOpen } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Document {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    category: string;
    description: string | null;
    storagePath: string;
    createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
    CONTRACT: 'Contrato',
    INVOICE: 'Factura',
    RECEIPT: 'Comprobante',
    PERMIT: 'Permiso',
    LAYOUT: 'Plano',
    PHOTO: 'Foto',
    OTHER: 'Otro',
};

const CATEGORY_COLORS: Record<string, 'info' | 'success' | 'warning' | 'neutral'> = {
    CONTRACT: 'info',
    INVOICE: 'success',
    RECEIPT: 'success',
    PERMIT: 'warning',
    LAYOUT: 'info',
    PHOTO: 'neutral',
    OTHER: 'neutral',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface DocumentPortalProps {
    userId: string;
    quotationId?: string;
}

export async function DocumentPortal({ userId, quotationId }: DocumentPortalProps) {
    const supabase = createServiceRoleClient();

    let query = supabase
        .from('client_documents')
        .select('id, file_name, file_type, file_size, category, description, storage_path, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (quotationId) {
        query = query.eq('quotation_id', quotationId);
    }

    const { data } = await query;

    const documents: Document[] = (data ?? []).map(d => ({
        id: d.id,
        fileName: d.file_name,
        fileType: d.file_type,
        fileSize: d.file_size,
        category: d.category,
        description: d.description,
        storagePath: d.storage_path,
        createdAt: d.created_at,
    }));

    return (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-lg font-semibold text-foreground">Documentos</h3>
                </div>
                <span className="text-xs text-muted-foreground">{documents.length} archivos</span>
            </div>

            {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay documentos disponibles aún.</p>
                    <p className="text-xs mt-1">Los contratos y comprobantes aparecerán aquí.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {documents.map((doc) => (
                        <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/10 hover:bg-muted/20 transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{doc.fileName}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Badge variant={CATEGORY_COLORS[doc.category] ?? 'neutral'} className="text-[10px]">
                                            {CATEGORY_LABELS[doc.category] ?? doc.category}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">{formatBytes(doc.fileSize)}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(doc.createdAt).toLocaleDateString('es-CL')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <a
                                href={doc.storagePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted/30 transition-colors shrink-0"
                                title="Descargar"
                            >
                                <Download className="h-4 w-4 text-muted-foreground" />
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
