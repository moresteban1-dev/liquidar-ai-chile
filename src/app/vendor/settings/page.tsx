'use client';

import { useEffect, useState } from 'react';
import { ProfileForm } from '@/components/shared/ProfileForm';
import { getUserProfile } from '@/actions/users';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, User } from 'lucide-react';
import { BankInfoCard } from '@/components/dashboard/BankInfoCard';
import { ProviderBankForm } from '@/components/vendor/ProviderBankForm';

import { UserProfile } from '@/lib/types';

export default function VendorSettingsPage() {
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
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Configuración</h1>
                <p className="text-muted-foreground mt-1">Gestiona tu perfil de proveedor.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="w-full max-w-md h-11 p-1 bg-muted/50 border border-border/50 rounded-lg flex items-center gap-1">
                    <TabsTrigger value="profile" className="flex-1 h-full rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-sm">
                        <User className="mr-2 h-4 w-4" /> Perfil
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="flex-1 h-full rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-sm">
                        <CreditCard className="mr-2 h-4 w-4" /> Pagos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="animate-in fade-in-50 duration-300">
                    <ProfileForm initialData={profile} />
                </TabsContent>

                <TabsContent value="payments" className="animate-in fade-in-50 duration-300 space-y-8">
                    <ProviderBankForm profile={profile} />
                    <div className="pt-6 border-t border-border">
                        <h2 className="text-xl font-semibold mb-4 text-foreground/80">
                            Datos Bancarios de Liquidar.cl (Para Facturación/Comisiones)
                        </h2>
                        <BankInfoCard />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
