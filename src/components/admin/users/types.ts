import { UserRole } from '@/core/domain/auth/UserRole';

export type UserProfile = {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    phone: string | null;
    created_at: string;
    is_active?: boolean;
    last_sign_in_at?: string;
};
