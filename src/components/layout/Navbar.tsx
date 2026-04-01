'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { UserRole, normalizeRole } from '@/core/domain/auth/UserRole';

export function Navbar() {
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<UserRole>(UserRole.CLIENT);
    const supabase = createClient();
    const { unreadCount } = useNotifications();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                const role = normalizeRole(profile?.role);
                setUserRole(role);
            }

            setLoading(false);
        };
        checkUser();
    }, [supabase, supabase.auth]);

    // Don't show Navbar on dashboard pages (they have their own sidebar)
    if (pathname.startsWith('/admin') || pathname.startsWith('/vendor') || pathname.startsWith('/client')) {
        return null;
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">DS</span>
                        </div>
                        <span className="font-bold text-xl text-foreground">Dropservice</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="#servicios" className="text-sm font-medium text-muted-foreground hover:text-indigo-600 transition-colors">
                            Servicios
                        </Link>
                        <Link href="#proceso" className="text-sm font-medium text-muted-foreground hover:text-indigo-600 transition-colors">
                            Cómo funciona
                        </Link>
                        <Link href="#testimonios" className="text-sm font-medium text-muted-foreground hover:text-indigo-600 transition-colors">
                            Testimonios
                        </Link>
                    </div>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-4">
                        {loading ? (
                            <div className="w-24 h-9 bg-muted rounded-md animate-pulse" />
                        ) : user ? (
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            <Link href={`/${userRole.toLowerCase()}` as any} className="flex items-center gap-4">
                                <div className="relative">
                                    <Bell className="h-5 w-5 text-muted-foreground hover:text-indigo-600 transition-colors" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                                    Ir a mi Dashboard
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" className="text-muted-foreground hover:text-indigo-600">
                                        Iniciar Sesión
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                                        Registrarse
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
