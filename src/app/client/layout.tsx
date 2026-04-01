import { ShadcnDashboardLayout } from '@/components/layout/ShadcnDashboardLayout';
import { getUserProfile } from '@/actions/users';
// TODO: Migrar SalesAgentChat a @ai-sdk/react v6 cuando se active en producción
// import { SalesAgentChat } from '@/components/ai/SalesAgentChat';

export const dynamic = 'force-dynamic';

export default async function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const profile = await getUserProfile();

    return (
        <ShadcnDashboardLayout
            role="client"
            userName={profile?.name || 'Cliente'}
            userEmail={profile?.email || ''}
        >
            {children}
            {/* SalesAgentChat desactivado temporalmente — requiere migración @ai-sdk/react v6 */}
        </ShadcnDashboardLayout>
    );
}
