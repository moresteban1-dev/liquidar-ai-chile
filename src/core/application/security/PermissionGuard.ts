import { UserRole } from '@/core/domain/auth/UserRole';
import { Permission, ROLE_PERMISSIONS } from '@/types/order';
import { Result } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';

export class PermissionGuard {
    /**
     * Checks if a user with a given role has the required permission.
     */
    static hasPermission(role: UserRole, permission: Permission): boolean {
        const permissions = ROLE_PERMISSIONS[role];
        if (!permissions) return false;
        
        return permissions.includes(permission);
    }

    /**
     * Ensures the user has the required permission, returning a Result.
     */
    static ensurePermission(role: UserRole, permission: Permission): Result<void, AppError> {
        if (!this.hasPermission(role, permission)) {
            return Result.fail(
                AppError.unauthorized(`Access Denied: Role "${role}" lacks permission "${permission}"`)
            );
        }
        return Result.ok(undefined);
    }

    /**
     * Checks if a user is authorized to perform an action on a specific resource.
     * @param role The user's role
     * @param permission The required permission
     * @param userId The ID of the authenticated user
     * @param ownerId The ID of the resource's owner (optional)
     */
    static isAuthorized(role: UserRole, permission: Permission, userId: string, ownerId?: string): boolean {
        // Admins can always do everything if they have the permission
        if (role === UserRole.ADMIN && this.hasPermission(role, permission)) {
            return true;
        }

        // If it's an "own" permission, check ownerId
        if (permission.includes(':own') && ownerId) {
            return userId === ownerId && this.hasPermission(role, permission);
        }

        return this.hasPermission(role, permission);
    }
}
