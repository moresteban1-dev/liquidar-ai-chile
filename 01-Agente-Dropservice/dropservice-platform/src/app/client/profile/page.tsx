'use client';

import { useEffect, useState } from 'react';
import { ProfileForm } from '@/components/shared/ProfileForm';
import { BankInfoCard } from '@/components/dashboard/BankInfoCard';
import { getUserProfile } from '@/actions/users';
import { Skeleton } from '@/components/ui/skeleton';

import { UserProfile } from '@/lib/types';

export default function ClientProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUserProfile().then((data) => {
            setProfile(data);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-10 w-48 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <Skeleton className="h-96 w-full max-w-md" />
            </div>
        );
    }

    if (!profile) return <div>Error al cargar perfil</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Mi Perfil</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Gestiona tu información personal.</p>
            </div>

            <ProfileForm initialData={profile} />

            <div className="pt-6 border-t border-border">
                <BankInfoCard />
            </div>
        </div>
    );
}
