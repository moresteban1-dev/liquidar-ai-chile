import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { UserRole, normalizeRole } from '@/core/domain/auth/UserRole';

/**
 * Server-only session resolver for Next.js App Router.
 * Used in Server Components and Server Actions.
 * NEVER import this from "use client" files.
 */

export interface ServerSession {
  readonly userId: string;
  readonly email: string;
  readonly role: UserRole;
  readonly name: string;
}

export const ADMIN_EMAILS = [
  'inversionsanagustin@gmail.com',
  'moresteban1@gmail.com',
  'admin@liquidar.cl',
];

export async function getServerSession(): Promise<ServerSession | null> {
  try {
    const cookieStore = await cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return null;

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // Can't set cookies in Server Components (read-only)
            }
          },
        },
      },
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    const userEmail = (user.email ?? '').toLowerCase().trim();
    let role = UserRole.CLIENT;

    if (ADMIN_EMAILS.includes(userEmail)) {
      role = UserRole.ADMIN;
    } else {
      role = normalizeRole(user.user_metadata?.role);
    }

    return {
      userId: user.id,
      email: user.email ?? '',
      role,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'Usuario',
    };
  } catch (err) {
    console.error('Error resolving server session:', err);
    return null;
  }
}
