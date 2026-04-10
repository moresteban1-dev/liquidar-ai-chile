'use client';

/**
 * NotificationCenter — Slide-over sheet triggered by Bell icon.
 * Optimized for performance and clean architecture.
 */

import { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, ExternalLink, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { Route } from 'next';
import { useClientNotifications, Notification } from './hooks/useClientNotifications';

/**
 * Atomic components for list rendering optimization
 */
interface NotificationItemProps {
    notification: Notification;
    onMarkRead: (id: string) => void;
    onClose: () => void;
}

const NotificationItem = ({ notification: n, onMarkRead, onClose }: NotificationItemProps) => {
    const priorityBorder: Record<string, string> = {
        URGENT: 'border-l-red-500',
        HIGH: 'border-l-amber-500',
        NORMAL: 'border-l-transparent',
        LOW: 'border-l-transparent',
    };

    const formatRelativeTime = (iso: string): string => {
        // eslint-disable-next-line react-hooks/purity
        const diff = Date.now() - new Date(iso).getTime();
        const minutes = Math.floor(diff / 60_000);
        if (minutes < 1) return 'Ahora';
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        return hours < 24 ? `${hours}h` : new Date(iso).toLocaleDateString();
    };

    return (
        <div
            className={cn(
                'px-4 py-3 transition-all border-l-4 duration-200',
                priorityBorder[n.priority] ?? 'border-l-transparent',
                !n.isRead && 'bg-indigo-50/50 dark:bg-indigo-950/20',
            )}
        >
            <div className="flex gap-3">
                <span className="text-lg shrink-0 mt-0.5">{n.icon ?? '🔔'}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className={cn("text-sm truncate", !n.isRead ? "font-bold" : "font-medium")}>
                            {n.title}
                        </h4>
                        {!n.isRead && <Circle className="w-2 h-2 fill-indigo-500 text-indigo-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
                        {n.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2.5">
                        <span className="text-[10px] font-medium text-muted-foreground/60">
                            {formatRelativeTime(n.createdAt)}
                        </span>
                        {n.actionUrl && (
                            <Link
                                href={n.actionUrl as Route}
                                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                                onClick={() => {
                                    if (!n.isRead) onMarkRead(n.id);
                                    onClose();
                                }}
                            >
                                <ExternalLink className="w-3 h-3" />
                                {n.actionLabel ?? 'Ver'}
                            </Link>
                        )}
                        {!n.isRead && (
                            <button
                                className="text-[10px] font-medium text-muted-foreground/70 hover:text-foreground transition-colors"
                                onClick={() => onMarkRead(n.id)}
                            >
                                Marcar leída
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export function NotificationCenter() {
    const [open, setOpen] = useState(false);
    const { 
        notifications, 
        unreadCount, 
        loading, 
        markAsRead, 
        markAllAsRead, 
        fetchNotifications 
    } = useClientNotifications(open);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) fetchNotifications();
    };

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-muted/80 rounded-full transition-all active:scale-90" aria-label="Notificaciones">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white ring-2 ring-background animate-in zoom-in">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-l shadow-2xl">
                <SheetHeader className="p-5 pb-4 border-b bg-muted/10">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-lg font-extrabold tracking-tight">
                            Bandeja de Entrada
                            {unreadCount > 0 && (
                                <Badge variant="info" className="ml-3 text-[10px] py-0 px-2 h-5 rounded-full">
                                    {unreadCount} nuevas
                                </Badge>
                            )}
                        </SheetTitle>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 gap-1.5 px-3 rounded-full"
                                onClick={markAllAsRead}
                            >
                                <CheckCheck className="h-3.5 w-3.5" />
                                Marcar todas
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    {loading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-3">
                            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-medium text-muted-foreground">Sincronizando notificaciones...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-60 px-8 text-center">
                            <div className="bg-muted/20 p-4 rounded-full mb-4">
                                <Bell className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground">Tu bandeja está vacía</h3>
                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                No tienes notificaciones pendientes. Te avisaremos cuando ocurra algo importante.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y border-b">
                            {notifications.map((n) => (
                                <NotificationItem 
                                    key={n.id} 
                                    notification={n} 
                                    onMarkRead={markAsRead} 
                                    onClose={() => setOpen(false)} 
                                />
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
