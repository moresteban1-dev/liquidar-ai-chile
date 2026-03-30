import { QuotationHistoryEntry } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { ClipboardList, CheckCircle2, AlertCircle, Send, User, RotateCcw, Clock } from 'lucide-react';
import { UserRole } from '@/core/domain/auth/UserRole';

interface QuotationHistoryTimelineProps {
    history: QuotationHistoryEntry[];
}

export function QuotationHistoryTimeline({ history }: QuotationHistoryTimelineProps) {
    if (!history || history.length === 0) {
        return (
            <div className="p-4 bg-muted text-muted-foreground text-sm rounded-lg text-center font-medium">
                No hay historial registrado para esta cotización.
            </div>
        );
    }

    // Sort descending (newest first)
    const sortedHistory = [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const getIcon = (status: string) => {
        switch (status) {
            case 'PENDING_ASSIGNMENT':
            case 'PENDING_PROVIDER_BID':
                return <Clock className="w-4 h-4 text-blue-500" />;
            case 'PENDING_ADMIN_APPROVAL':
                return <ClipboardList className="w-4 h-4 text-amber-500" />;
            case 'AWAITING_CLIENT_PAYMENT':
                return <Send className="w-4 h-4 text-indigo-500" />;
            case 'APPROVED':
            case 'PAID':
            case 'FULFILLED':
                return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'REJECTED':
            case 'CANCELLED':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <RotateCcw className="w-4 h-4 text-slate-500" />;
        }
    };

    const formatAction = (item: QuotationHistoryEntry) => {
        const actor = item.actorType === 'SISTEMA' ? 'Sistema' :
            item.actorType === UserRole.VENDOR ? 'Proveedor' :
                item.actorType === UserRole.CLIENT ? 'Cliente' : 'Admin';

        return (
            <div className="flex flex-col">
                <span className="font-semibold text-foreground text-sm">
                    {item.newStatus.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <User className="w-3 h-3" /> {actor}
                </span>
                {item.comment && (
                    // eslint-disable-next-line react/jsx-no-comment-textnodes
                    <span className="text-sm mt-1 text-slate-600 dark:text-slate-300 italic">
                        // eslint-disable-next-line react/no-unescaped-entities
                        // eslint-disable-next-line react/no-unescaped-entities
                        "{item.comment}"
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Línea de Tiempo
            </h3>
            // eslint-disable-next-line react/jsx-no-comment-textnodes
            <div className="relative border-l border-border ml-2 md:ml-4 space-y-6 pb-4">
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                {sortedHistory.map((item, _index) => (
                    <div key={item.id} className="relative pl-6">
                        {/* Timeline dot */}
                        <div className="absolute -left-3 top-1 bg-background border rounded-full p-1 shadow-sm">
                            {getIcon(item.newStatus)}
                        </div>
                        {/* Content */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 bg-card border border-border p-3 rounded-lg shadow-sm">
                            {formatAction(item)}
                            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded">
                                {formatDate(item.createdAt)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
