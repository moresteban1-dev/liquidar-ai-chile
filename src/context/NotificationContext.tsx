'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface NotificationContextType {
    unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();
        const setupRealtime = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const userId = session.user.id;

            // Channel for Order Updates
            const channel = supabase
                .channel('realtime:orders')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'orders',
                        filter: `clientId=eq.${userId}`, // Listen for Client's orders
                    },
                    (payload: { new: { id: string, status?: string }; old: { status?: string } }) => {
                        const newStatus = payload.new.status;
                        const oldStatus = payload.old.status;

                        if (newStatus !== oldStatus) {
                            toast.info(`Actualización de Orden: ${newStatus}`, {
                                description: `Tu orden ha cambiado de estado de ${oldStatus} a ${newStatus}`,
                                action: {
                                    label: 'Ver',
                                    onClick: () => router.push(`/client/orders/${payload.new.id}`)
                                }
                            });
                            setUnreadCount(prev => prev + 1);
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'orders',
                        filter: `vendorId=eq.${userId}`, // Listen for Vendor's orders
                    },
                    (payload: { new: { id: string, status?: string }; old: { status?: string } }) => {
                        toast.success('¡Nueva asignación o actualización!', {
                            description: `Revisa tus órdenes asignadas via dashboard.`,
                            action: {
                                label: 'Ver',
                                onClick: () => router.push(`/vendor/orders/${payload.new.id}`)
                            }
                        });
                        setUnreadCount(prev => prev + 1);
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT', // New assignments
                        schema: 'public',
                        table: 'orders',
                        filter: `vendorId=eq.${userId}`,
                    },
                    (payload: { new: { id: string, status?: string }; old: { status?: string } }) => {
                        toast.success('¡Nueva Orden Asignada!', {
                            description: `Se te ha asignado una nueva orden.`,
                            action: {
                                label: 'Ver',
                                onClick: () => router.push(`/vendor/orders/${payload.new.id}`)
                            }
                        });
                        setUnreadCount(prev => prev + 1);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        setupRealtime();
    }, [router]);

    return (
        <NotificationContext.Provider value={{ unreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
