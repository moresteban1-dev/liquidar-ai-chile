import { ShadcnDashboardLayout } from '@/components/layout/ShadcnDashboardLayout';
import { AdminCommandMenu } from '@/components/features/admin/AdminCommandMenu';
import { getUserProfile } from '@/actions/users';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const profile = await getUserProfile();

    return (
        <ShadcnDashboardLayout
            role="admin"
            userName={profile?.name || 'Administrador'}
            userEmail={profile?.email || ''}
        >
            <AdminCommandMenu />
            {children}
        </ShadcnDashboardLayout>
    );
}
