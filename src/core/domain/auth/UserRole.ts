/**
 * UserRole — Centralized Role Sovereignty (RBAC)
 * 
 * Standardizes roles to UPPERCASE English across the platform.
 * Provides normalization from legacy Spanish or lowercase strings.
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  VENDOR = 'VENDOR',
  CLIENT = 'CLIENT',
}

/**
 * Normalizes any role string to the standard UserRole.
 * Handles legacy strings like 'PROVEEDOR', 'CLIENTE' or lowercase 'admin'.
 */
export function normalizeRole(role: string | null | undefined): UserRole {
  if (!role) return UserRole.CLIENT;
  
  const upperRole = role.toUpperCase();
  
  switch (upperRole) {
    case 'ADMIN':
    case 'SUPERADMIN':
      return UserRole.ADMIN;
      
    case 'VENDOR':
    case 'PROVEEDOR':
    case 'PROVIDER':
      return UserRole.VENDOR;
      
    case 'CLIENT':
    case 'CLIENTE':
    case 'USER':
      return UserRole.CLIENT;
      
    default:
      return UserRole.CLIENT;
  }
}
