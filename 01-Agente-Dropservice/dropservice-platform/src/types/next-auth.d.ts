/**
 * NextAuth Type Augmentation
 * Extiende tipos para incluir rol de usuario
 */

import 'next-auth';
import { UserRole } from '@/lib/types';

declare module 'next-auth' {
    interface User {
        role?: UserRole;
    }

    interface Session {
        user: {
            id: string;
            email: string;
            name?: string | null;
            role?: string;
        };
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id?: string;
        role?: string;
    }
}
