/**
 * Admin Invitation System — Identity Fortress
 * 
 * Secure token-based invitation logic.
 */

import { createServiceRoleClient } from '@/lib/supabase/api';
import crypto from 'crypto';
import { logSecurityEvent } from '@/lib/security/audit-logger';

export class AdminInvitationService {
    private supabase;

    constructor() {
        this.supabase = createServiceRoleClient();
    }

    /**
     * Generates a time-limited token for a new admin.
     * Only existing admins can call this.
     */
    async createInvitation(email: string, invitedBy: string) {
        // 1. Verify inviter is ADMIN
        const { data: inviter } = await this.supabase
            .from('profiles')
            .select('role')
            .eq('id', invitedBy)
            .single();

        if (inviter?.role !== 'ADMIN') {
            await logSecurityEvent({
                action: 'UNAUTHORIZED_INVITATION_ATTEMPT',
                actor: invitedBy,
                target: email,
                severity: 'HIGH'
            });
            throw new Error('Solo los administradores pueden crear invitaciones');
        }

        // 2. Generate secure token
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        // 3. Mark existing invitations for this email as used/expired
        await this.supabase.from('admin_invitations').update({ used: true }).eq('email', email);

        // 4. Insert new invitation
        const { error } = await this.supabase.from('admin_invitations').insert({
            email,
            token_hash: tokenHash,
            invited_by: invitedBy,
            expires_at: expiresAt.toISOString()
        });

        if (error) throw error;

        await logSecurityEvent({
            action: 'ADMIN_INVITATION_CREATED',
            actor: invitedBy,
            target: email,
            metadata: { expiresAt }
        });

        return { token, expiresAt };
    }

    /**
     * Validates and consumes an invitation during registration.
     */
    async consumeInvitation(email: string, token: string): Promise<boolean> {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const { data: invitation, error } = await this.supabase
            .from('admin_invitations')
            .select('*')
            .eq('email', email)
            .eq('token_hash', tokenHash)
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error || !invitation) {
            await logSecurityEvent({
                action: 'ADMIN_INVITATION_VALIDATION_FAILED',
                actor: 'anonymous',
                target: email,
                severity: 'MEDIUM'
            });
            return false;
        }

        // Consume token
        await this.supabase.from('admin_invitations').update({ 
            used: true,
            used_at: new Date().toISOString()
        }).eq('id', invitation.id);

        await logSecurityEvent({
            action: 'ADMIN_INVITATION_CONSUMED',
            actor: email,
            target: email,
            severity: 'LOW',
            metadata: { invitationId: invitation.id }
        });

        return true;
    }
}
