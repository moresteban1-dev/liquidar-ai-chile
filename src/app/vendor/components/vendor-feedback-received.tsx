/**
 * VendorFeedbackReceived — RSC showing feedback from clients.
 */
import { getVendorFeedbackReceived } from '@/lib/dashboard/vendor-data.service';
import { Star, ThumbsUp, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-muted text-muted-foreground/30'
                        }`}
                />
            ))}
        </div>
    );
}

export async function VendorFeedbackReceived() {
    const feedback = await getVendorFeedbackReceived();

    const avgRating = feedback.length > 0
        ? (feedback.reduce((s, f) => s + f.overallRating, 0) / feedback.length).toFixed(1)
        : null;

    return (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    <h3 className="text-lg font-semibold text-foreground">Evaluaciones de Clientes</h3>
                </div>
                {avgRating && (
                    <div className="flex items-center gap-1.5">
                        <span className="text-lg font-bold text-foreground">{avgRating}</span>
                        <StarRating rating={Math.round(Number(avgRating))} />
                    </div>
                )}
            </div>

            {feedback.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Aún no tienes evaluaciones.</p>
                    <p className="text-xs mt-1">Las evaluaciones aparecerán cuando los clientes califiquen tus servicios.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {feedback.map(f => (
                        <div key={f.id} className="p-3 rounded-lg border border-border/50 bg-muted/10">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <StarRating rating={f.overallRating} />
                                    <span className="font-mono text-[10px] text-muted-foreground">{f.quotationCode}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {f.wouldRecommend && (
                                        <Badge variant="success" className="text-[10px] gap-0.5">
                                            <ThumbsUp className="h-2.5 w-2.5" />
                                            Recomienda
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {f.comment && (
                                <div className="flex items-start gap-1.5 mt-2">
                                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
                                    <p className="text-sm text-foreground/80 italic">&ldquo;{f.comment}&rdquo;</p>
                                </div>
                            )}

                            {/* Dimension ratings */}
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                                {f.qualityRating && <span>Calidad: {f.qualityRating}/5</span>}
                                {f.punctualityRating && <span>Puntualidad: {f.punctualityRating}/5</span>}
                                {f.communicationRating && <span>Comunicación: {f.communicationRating}/5</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
