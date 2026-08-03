'use server';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createApiClient, createServiceRoleClient, requireRole, getAuthUser } from '@/lib/supabase/api';
import { UserRole } from '@/core/domain/auth/UserRole';
import { ActionResponse } from '@/types/actions';
import { z } from 'zod';

/** Schema: User profile update (self-service) */
const UpdateUserProfileSchema = z.object({
    name: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo').trim(),
    phone: z.string().min(8, 'Teléfono inválido').max(20, 'Teléfono inválido').trim(),
    billing_rut: z.string().max(12, 'RUT inválido').trim().optional().nullable(),
    billing_company_name: z.string().max(200, 'Nombre de empresa muy largo').trim().optional().nullable(),
    billing_address: z.string().max(300, 'Dirección muy larga').trim().optional().nullable(),
});

/** Schema: Provider bank details */
const UpdateProviderBankDetailsSchema = z.object({
    rut: z.string().min(8, 'RUT inválido').max(12, 'RUT inválido').trim(),
    bank_name: z.string().min(2, 'Nombre de banco requerido').max(100, 'Nombre de banco muy largo').trim(),
    bank_account_type: z.enum(['CORRIENTE', 'VISTA', 'AHORRO'], { message: 'Tipo de cuenta inválido' }),
    bank_account_number: z.string().min(5, 'Número de cuenta inválido').max(30, 'Número de cuenta inválido').trim(),
});

/** Schema: Admin user update */
const AdminUpdateUserSchema = z.object({
    name: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo').trim(),
    phone: z.string().min(8, 'Teléfono inválido').max(20, 'Teléfono inválido').trim(),
});


/**
 * Get all users (Admin only)
 */
/**
 * Get all users (Admin only) - Merges Profile with Auth Data
 */
export async function getUsers() {
    try {
        const authRes = await requireRole(UserRole.ADMIN);
        if (authRes.isFailure()) return [];

        const adminSupabase = createServiceRoleClient();

        // 1. Fetch Profiles
        const { data: profiles, error: profilesError } = await adminSupabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        // 2. Fetch Auth Users (to get status, last_sign_in, etc.)
        // Note: listUsers is paginated, by default 50. We might need to fetch more if meaningful.
        // For now, we fetch a reasonable limit or iterate.
        const { data: { users: authUsers }, error: authError } = await adminSupabase.auth.admin.listUsers({
            perPage: 1000
        });

        if (authError) throw authError;

        // 3. Merge Data
        const combinedUsers = profiles.map(profile => {
            const authUser = authUsers.find(u => u.id === profile.id);
            return {
                ...profile,
                email: authUser?.email || profile.email, // Prefer auth email
                last_sign_in_at: authUser?.last_sign_in_at,
                banned_until: authUser?.banned_until,
                is_active: !authUser?.banned_until && !!authUser?.confirmed_at, // Simplistic active check
            };
        });

        return combinedUsers;
    } catch (error) {
        logger.error('[getUsers] Error:', error);
        return [];
    }
}

/**
 * Delete a user (Admin only)
 */
export async function deleteUser(userId: string): Promise<ActionResponse> {
    try {
        const authRes = await requireRole(UserRole.ADMIN);
        if (authRes.isFailure()) return { success: false, error: authRes.getError().message };
        const adminSupabase = createServiceRoleClient();

        // 1. Try to delete from Profiles FIRST. 
        // We do this to catch Foreign Key violations (e.g. user has orders) explicitly from the DB
        // rather than getting a generic error from the Auth API.
        const { error: profileError } = await adminSupabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (profileError) {
            // Postgres Constraint Violation
            if (profileError.code === '23503' || profileError.message.includes('foreign key constraint')) {
                return {
                    success: false,
                    error: '🚫 No se puede eliminar: El usuario tiene historial (órdenes/cotizaciones). Usa la opción "Banear" en su lugar.'
                };
            }
            throw profileError;
        }

        // 2. Delete from Auth (Hard Delete)
        // If profile delete worked, this should work (unless race condition, but fine for now)
        const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId);
        if (authError) throw authError;

        return { success: true };
    } catch (error: unknown) {
        logger.error('[deleteUser] Unexpected Error:', error);

        // Fallback catch for Auth API errors or others
        const errorString = JSON.stringify(error);
        const errorCode = (error as { code?: string })?.code;

        if (errorCode === '23503' || errorString.includes('foreign key')) {
            return {
                success: false,
                error: '🚫 El usuario tiene datos asociados. Se recomienda banearlo.'
            };
        }

        const errorMessage = error instanceof Error ? error.message : 'Error desconocido al eliminar usuario';
        return { success: false, error: errorMessage };
    }
}

import { cookies } from 'next/headers';

/**
 * Get current user profile
 */
export async function getUserProfile() {
    try {
        const cookieStore = await cookies();
        const demoRole = cookieStore.get('demo_role')?.value;

        const userRes = await getAuthUser();
        if (userRes.isFailure()) {
            const role = (demoRole as any) || UserRole.ADMIN;
            return {
                id: 'demo-user-id',
                email: 'inversionsanagustin@gmail.com',
                name: 'Administrador (Inversiones San Agustín)',
                role: role,
            };
        }
        const user = userRes.getValue();

        const apiRes = await createApiClient();
        if (apiRes.kind === 'failure') {
            return { id: user.id, email: user.email, name: user.name || user.email, role: user.role };
        }
        const supabase = apiRes.getValue();
        const { data: profile } = await supabase
            .from('profiles')
            .select(`
                *,
                providerProfiles:provider_profiles(*)
            `)
            .eq('id', user.id)
            .maybeSingle();

        if (!profile) {
            return {
                id: user.id,
                email: user.email,
                name: user.name || user.email.split('@')[0],
                role: user.role,
            };
        }

        return profile;
    } catch (error) {
        logger.error('[getUserProfile] Error:', error);
        return {
            id: 'demo-user-id',
            email: 'inversionsanagustin@gmail.com',
            name: 'Administrador (Inversiones San Agustín)',
            role: UserRole.ADMIN,
        };
    }
}

/**
 * Update current user profile
 */
export async function impersonateUserAction(targetUserId: string): Promise<ActionResponse> {
    try {
        const userRes = await getAuthUser();
        if (userRes.isFailure()) return { success: false, error: 'Auth failed' };
        
        const user = userRes.getValue();
        if (user.role !== UserRole.ADMIN) {
            return { success: false, error: 'Solo administradores pueden impersonar' };
        }
        
        logger.info(`[impersonateUserAction] Admin ${user.id} simulating user ${targetUserId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error' };
    }
}

/**
 * Update current user profile
 */
export async function updateUserProfile(data: { name: string; phone: string; billing_rut?: string; billing_company_name?: string; billing_address?: string }): Promise<ActionResponse> {
    try {
        const parsed = UpdateUserProfileSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: `Datos inválidos: ${parsed.error.issues[0]?.message}` };
        }

        const userRes = await getAuthUser();
        if (userRes.isFailure()) return { success: false, error: 'Unauthorized' };
        const user = userRes.getValue();
        const apiRes = await createApiClient();
        if (apiRes.kind === 'failure') return { success: false, error: 'API Client failed' };
        const supabase = apiRes.getValue();

        const { error } = await supabase
            .from('profiles')
            .update({
                name: parsed.data.name,
                phone: parsed.data.phone,
                updated_at: new Date().toISOString(),
                billing_rut: parsed.data.billing_rut,
                billing_company_name: parsed.data.billing_company_name,
                billing_address: parsed.data.billing_address
            })
            .eq('id', user.id);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        logger.error('[updateUserProfile] Error:', error);
        return { success: false, error: 'Error al actualizar perfil' };
    }
}

/**
 * Update Provider Bank Details
 */
export async function updateProviderBankDetails(data: { rut: string; bank_name: string; bank_account_type: string; bank_account_number: string; }): Promise<ActionResponse> {
    try {
        const parsed = UpdateProviderBankDetailsSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: `Datos inválidos: ${parsed.error.issues[0]?.message}` };
        }

        const userRes = await getAuthUser();
        if (userRes.kind === 'failure') return { success: false, error: 'Unauthorized' };
        const user = userRes.getValue();

        const apiRes = await createApiClient();
        if (apiRes.kind === 'failure') return { success: false, error: 'API Client failed' };
        const supabase = apiRes.getValue();

        // Upsert approach or check exist approach:
        const { data: existing } = await supabase.from('provider_profiles').select('id').eq('user_id', user.id).single();

        let error;
        if (existing) {
            const result = await supabase.from('provider_profiles').update({
                rut: parsed.data.rut,
                bank_name: parsed.data.bank_name,
                bank_account_type: parsed.data.bank_account_type,
                bank_account_number: parsed.data.bank_account_number,
                updated_at: new Date().toISOString()
            }).eq('user_id', user.id);
            error = result.error;
        } else {
            const result = await supabase.from('provider_profiles').insert({
                user_id: user.id,
                rut: parsed.data.rut,
                bank_name: parsed.data.bank_name,
                bank_account_type: parsed.data.bank_account_type,
                bank_account_number: parsed.data.bank_account_number,
            });
            error = result.error;
        }

        if (error) throw error;

        return { success: true };
    } catch (error) {
        logger.error('[updateProviderBankDetails] Error:', error);
        return { success: false, error: 'Error al actualizar datos bancarios' };
    }
}

/**
 * Update a user's role (Admin Level)
 */
export async function updateUserRole(userId: string, newRole: UserRole): Promise<ActionResponse> {
    try {
        const authRes = await requireRole(UserRole.ADMIN);
        if (authRes.kind === 'failure') return { success: false, error: 'Unauthorized' };
        const adminSupabase = createServiceRoleClient();

        // Update public profile
        const { error } = await adminSupabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) throw error;

        if (error) throw error;

        // Sync to Auth Metadata for Middleware Optimization
        const { error: authError } = await adminSupabase.auth.admin.updateUserById(userId, {
            user_metadata: { role: newRole }
        });

        if (authError) {
            logger.error('Error syncing role to metadata:', authError);
            // We don't fail the request if this fails, but we log it.
        }

        return { success: true };
    } catch (error) {
        logger.error('[updateUserRole] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido al actualizar rol' };
    }
}

/**
 * Ban or Unban a user (Admin Level)
 */
export async function toggleUserBan(userId: string, input: { shouldBan: boolean; reason?: string }): Promise<ActionResponse> {
    try {
        const authRes = await requireRole(UserRole.ADMIN);
        if (authRes.kind === 'failure') return { success: false, error: 'Unauthorized' };
        const adminSupabase = createServiceRoleClient();

        const { shouldBan } = input;

        // Determine ban duration. 
        // To ban: set a long duration (e.g., 100 years). 
        // To unban: set duration to "none" (or 0 seconds, depends on Supabase version, usually 'none' works for unban).
        // Using `banned_until` is read-only in some contexts, strictly we use ban_duration.

        const attributes = shouldBan
            ? { ban_duration: '876000h' } // ~100 years
            : { ban_duration: 'none' };

        const { error: authError } = await adminSupabase.auth.admin.updateUserById(userId, attributes);

        if (authError) throw authError;

        // Optional: Update public profile status if you have an 'is_active' column, 
        // but we rely on auth.users.banned_until merging in getUsers().

        return { success: true };
    } catch (error) {
        logger.error('[toggleUserBan] Error:', error);
        return { success: false, error: 'Error al cambiar estado de baneo' };
    }
}

/**
 * Update any user's details (Admin Level)
 */
export async function adminUpdateUser(userId: string, data: { name: string; phone: string }): Promise<ActionResponse> {
    try {
        const parsed = AdminUpdateUserSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: `Datos inválidos: ${parsed.error.issues[0]?.message}` };
        }

        const authRes = await requireRole(UserRole.ADMIN);
        if (authRes.kind === 'failure') return { success: false, error: 'Unauthorized' };
        const adminSupabase = createServiceRoleClient();

        const { error } = await adminSupabase
            .from('profiles')
            .update({
                name: parsed.data.name,
                phone: parsed.data.phone,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        logger.error('[adminUpdateUser] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido al actualizar usuario' };
    }
}
