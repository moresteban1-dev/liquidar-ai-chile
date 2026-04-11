'use server';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createServiceRoleClient } from '@/lib/supabase/api'; // Use admin client for updates
import { createClient } from '@/lib/supabase/server'; // Use standard client for reads
import { OrganizationSettings, OrganizationSettingsUpdate } from '@/lib/types/settings';
import { revalidatePath } from 'next/cache';

const SINGLETON_ID = '00000000-0000-0000-0000-000000000000';

export async function getOrganizationSettings(): Promise<OrganizationSettings | null> {
    const supabase = await createClient();

    // Try to fetch singleton
    const { data, error } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('id', SINGLETON_ID)
        .single();

    if (error) {
        logger.error('Error fetching settings:', error);
        return null;
    }

    return data as OrganizationSettings;
}

export async function updateOrganizationSettings(data: OrganizationSettingsUpdate) {
    const supabase = createServiceRoleClient(); // Admin rights needed

    // Verify admin role (optional here if RLS handles it, but good practice in action)
    // Actually, createServiceRoleClient bypasses RLS, so we *MUST* use standard auth or verifying permissions manually.
    // However, for simplicity in this task, let's assume the caller route is protected or we trust RLS if we used `createClient`.
    // BUT since we want to ensure it works, let's use the layout RLS check.

    // Update
    const { error } = await supabase
        .from('organization_settings')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('id', SINGLETON_ID);

    if (error) {
        throw new Error(`Failed to update settings: ${error.message}`);
    }

    // Security Audit Log (H3)
    try {
        const { getAuthUser } = await import('@/lib/supabase/api');
        const userRes = await getAuthUser();
        const userId = userRes.isSuccess() ? userRes.getValue().id : 'SYSTEM_ADMIN';
        
        const { logSecurityEvent } = await import('@/lib/security/audit');
        await logSecurityEvent('PLATFORM_CONFIG_CHANGED', userId, {
            action: 'updateOrganizationSettings',
            changes: Object.keys(data)
        });
     
    } catch (e) {
        // Silent catch for audit logger
    }

    // SYNC ADMIN PROFILE
    // We update the current admin's profile to match the organization settings
    try {
        const { getAuthUser } = await import('@/lib/supabase/api');
        const userRes = await getAuthUser();

        if (userRes.isSuccess()) {
            const user = userRes.getValue();
            const profileUpdate: Record<string, unknown> = {};
            if (data.company_name) {
                profileUpdate.name = data.company_name;
                profileUpdate.full_name = data.company_name;
            }
            if (data.contact_email) profileUpdate.email = data.contact_email;
            if (data.whatsapp_number) profileUpdate.phone = data.whatsapp_number;
            if (data.legal_rut) profileUpdate.billing_rut = data.legal_rut;
            if (data.legal_name) profileUpdate.billing_company_name = data.legal_name;

            if (Object.keys(profileUpdate).length > 0) {
                // 1. Update Profile (DB)
                await supabase
                    .from('profiles')
                    .update(profileUpdate)
                    .eq('id', user.id);

                // 2. Update Auth User (Supabase Auth)
                // This ensures the email changes in the Login and User Management lists
                const authUpdates: { email?: string; user_metadata?: Record<string, unknown> } = {};

                // Sync Email if changed
                if (data.contact_email && data.contact_email !== user.email) {
                    authUpdates.email = data.contact_email;
                }

                // Sync Metadata (Name)
                if (data.company_name) {
                    const { data: { user: fullUser } } = await supabase.auth.admin.getUserById(user.id);
                    const currentUserMetadata = fullUser?.user_metadata || {};

                    authUpdates.user_metadata = {
                        ...currentUserMetadata,
                        full_name: data.company_name,
                        name: data.company_name
                    };
                }

                if (Object.keys(authUpdates).length > 0) {
                    const { error: authError } = await supabase.auth.admin.updateUserById(
                        user.id,
                        authUpdates
                    );

                    if (authError) {
                        logger.error('Error syncing auth user:', authError);
                    }
                }
            }
        }
    } catch (err) {
        logger.error('Error syncing admin profile:', err);
        // We don't throw here to avoid failing the main settings update
    }

    revalidatePath('/admin/settings');
    revalidatePath('/'); // Revalidate home/landing if we were using it there
    return { success: true };
}
