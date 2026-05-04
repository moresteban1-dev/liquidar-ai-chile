'use client';

/**
 * ItemProposalPanel — Admin panel to review item proposals from providers.
 *
 * Shows pending proposals with approve/reject actions.
 * Used in the admin dashboard or a dedicated proposals page.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    CheckCircle2,
    XCircle,
    Loader2,
    Package,
    AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Proposal {
    id: string;
    name: string;
    description: string | null;
    category: string;
    item_type: string;
    estimated_cost: number;
    unit_label: string;
    status: string;
    admin_notes: string | null;
    reviewed_at: string | null;
    created_at: string;
    provider: {
        id: string;
        company_name?: string;
    } | null;
}

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(val);

export function ItemProposalPanel() {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

    const fetchProposals = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/proposals?status=PENDING');
            if (res.ok) {
                const data = await res.json();
                setProposals(data.proposals || []);
            }
        } catch {
            toast.error('Error cargando propuestas');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchProposals();
    }, [fetchProposals]);

    const handleReview = async (proposalId: string, action: 'APPROVED' | 'REJECTED') => {
        setReviewingId(proposalId);
        try {
            const res = await fetch('/api/admin/proposals', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    proposalId,
                    action,
                    adminNotes: adminNotes[proposalId] || null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error en review');
            }

            toast.success(data.message);
            // Remove from list
            setProposals(prev => prev.filter(p => p.id !== proposalId));
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Error desconocido';
            toast.error(msg);
        } finally {
            setReviewingId(null);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-8 flex items-center justify-center text-muted-foreground gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando propuestas...
                </CardContent>
            </Card>
        );
    }

    if (proposals.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No hay propuestas pendientes</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        Propuestas de Ítems
                    </CardTitle>
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                        {proposals.length} pendientes
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {proposals.map((proposal) => (
                    <div
                        key={proposal.id}
                        className="border rounded-lg p-4 space-y-3 bg-muted/20"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="font-medium text-sm">{proposal.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[10px]">
                                        {proposal.item_type}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {proposal.category}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-semibold text-green-600">
                                    {formatCurrency(proposal.estimated_cost)}
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                    /{proposal.unit_label}
                                </span>
                            </div>
                        </div>

                        {proposal.description && (
                            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                {proposal.description}
                            </p>
                        )}

                        <div className="text-[10px] text-muted-foreground">
                            Proveedor: {proposal.provider?.company_name || 'Sin nombre'}
                            {' · '}
                            {new Date(proposal.created_at).toLocaleDateString('es-CL')}
                        </div>

                        <div className="space-y-2">
                            <div>
                                <Label className="text-[10px]">Notas de Admin (opcional)</Label>
                                <Input
                                    className="h-7 text-xs"
                                    placeholder="Observaciones..."
                                    value={adminNotes[proposal.id] || ''}
                                    onChange={(e) =>
                                        setAdminNotes(prev => ({
                                            ...prev,
                                            [proposal.id]: e.target.value
                                        }))
                                    }
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-xs"
                                    onClick={() => handleReview(proposal.id, 'APPROVED')}
                                    disabled={reviewingId === proposal.id}
                                >
                                    {reviewingId === proposal.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    ) : (
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                    )}
                                    Aprobar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 h-8 text-red-600 border-red-200 hover:bg-red-50 text-xs"
                                    onClick={() => handleReview(proposal.id, 'REJECTED')}
                                    disabled={reviewingId === proposal.id}
                                >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Rechazar
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
