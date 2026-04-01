import { ShadcnDashboardLayout } from '@/components/layout/ShadcnDashboardLayout';
import { getUserProfile } from '@/actions/users';

export const dynamic = 'force-dynamic';

export default async function VendorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const profile = await getUserProfile();

    return (
        <ShadcnDashboardLayout
            role="vendor"
            userName={profile?.name || 'Proveedor'}
            userEmail={profile?.email || ''}
        >
            {children}
        </ShadcnDashboardLayout>
    );
}
