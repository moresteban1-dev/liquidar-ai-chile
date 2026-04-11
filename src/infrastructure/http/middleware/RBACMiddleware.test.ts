import { describe, it, expect } from 'vitest'
import { requireOwnership } from './RBACMiddleware'
import { UserRole } from '@/core/domain/auth/UserRole'
import type { AuthenticatedUser } from './RBACMiddleware'

describe('RBAC Middleware', () => {
  describe('requireOwnership', () => {
    it('should allow admin access to any resource', () => {
      const admin: AuthenticatedUser = {
        id: 'admin-001',
        email: 'admin@test.com',
        role: UserRole.ADMIN
      }

      expect(requireOwnership('any-resource-owner', admin)).toBe(true)
    })

    it('should allow client access to own resources', () => {
      const client: AuthenticatedUser = {
        id: 'client-001',
        email: 'client@test.com',
        role: UserRole.CLIENT
      }

      expect(requireOwnership('client-001', client)).toBe(true)
    })

    it('should deny client access to other resources', () => {
      const client: AuthenticatedUser = {
        id: 'client-001',
        email: 'client@test.com',
        role: UserRole.CLIENT
      }

      expect(requireOwnership('client-002', client)).toBe(false)
    })
  })
})
