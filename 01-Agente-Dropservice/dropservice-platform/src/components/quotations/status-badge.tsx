import { QuotationPublicStatus } from '@/lib/types';

interface StatusBadgeProps {
    status: QuotationPublicStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const styles = {
        [QuotationPublicStatus.RECIBIDA]: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
        [QuotationPublicStatus.SOLICITADA]: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
        [QuotationPublicStatus.EN_PROCESO]: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
        [QuotationPublicStatus.EN_EVALUACION]: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
        [QuotationPublicStatus.EN_REVISION]: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20",
        [QuotationPublicStatus.COTIZADA]: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
        [QuotationPublicStatus.APPROVED]: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
        [QuotationPublicStatus.PAID]: "bg-green-100 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20",
        [QuotationPublicStatus.IN_PRODUCTION]: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
        [QuotationPublicStatus.EN_DESPACHO]: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20",
        [QuotationPublicStatus.DELIVERED]: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20",
        [QuotationPublicStatus.FINALIZED]: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20",
        [QuotationPublicStatus.REJECTED]: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
        [QuotationPublicStatus.EXPIRADA]: "bg-secondary text-secondary-foreground border-secondary",
        [QuotationPublicStatus.PENDING_REVIEW]: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
    };

    const labels = {
        [QuotationPublicStatus.RECIBIDA]: "Recibida",
        [QuotationPublicStatus.SOLICITADA]: "Solicitada",
        [QuotationPublicStatus.EN_PROCESO]: "En Proceso",
        [QuotationPublicStatus.EN_EVALUACION]: "En Evaluación",
        [QuotationPublicStatus.EN_REVISION]: "En Revisión",
        [QuotationPublicStatus.COTIZADA]: "Cotización Lista",
        [QuotationPublicStatus.APPROVED]: "Aprobada",
        [QuotationPublicStatus.PAID]: "Pagada",
        [QuotationPublicStatus.IN_PRODUCTION]: "En Producción",
        [QuotationPublicStatus.EN_DESPACHO]: "En Despacho",
        [QuotationPublicStatus.DELIVERED]: "Entregada",
        [QuotationPublicStatus.FINALIZED]: "Finalizada",
        [QuotationPublicStatus.REJECTED]: "Rechazada",
        [QuotationPublicStatus.EXPIRADA]: "Expirada",
        [QuotationPublicStatus.PENDING_REVIEW]: "Pendiente Revisión",
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
            {labels[status]}
        </span>
    );
}
