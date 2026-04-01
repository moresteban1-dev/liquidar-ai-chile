import { describe, it, expect } from 'vitest'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  describe('Creation', () => {
    it('should create with defaults', () => {
      const result = Pagination.create()

      expect(result.isSuccess()).toBe(true)
      const pagination = result.unwrap()
      expect(pagination.page).toBe(1)
      expect(pagination.pageSize).toBe(20)
      expect(pagination.offset).toBe(0)
      expect(pagination.sortBy).toBe('created_at')
      expect(pagination.sortOrder).toBe('desc')
    })

    it('should create with custom params', () => {
      const result = Pagination.create({
        page: 3,
        pageSize: 10,
        sortBy: 'event_date',
        sortOrder: 'asc'
      })

      expect(result.isSuccess()).toBe(true)
      const pagination = result.unwrap()
      expect(pagination.page).toBe(3)
      expect(pagination.pageSize).toBe(10)
      expect(pagination.offset).toBe(20)
      expect(pagination.sortBy).toBe('event_date')
      expect(pagination.sortOrder).toBe('asc')
    })

    it('should reject page < 1', () => {
      const result = Pagination.create({ page: 0 })
      expect(result.isFailure()).toBe(true)
    })

    it('should reject pageSize > 100', () => {
      const result = Pagination.create({ pageSize: 200 })
      expect(result.isFailure()).toBe(true)
    })

    it('should reject pageSize < 1', () => {
      const result = Pagination.create({ pageSize: 0 })
      expect(result.isFailure()).toBe(true)
    })
  })

  describe('toResult', () => {
    it('should build paginated result', () => {
      const pagination = Pagination.create({ page: 1, pageSize: 10 }).unwrap()
      const data = Array.from({ length: 10 }, (_, i) => ({ id: i }))

      const result = pagination.toResult(data, 35)

      expect(result.data).toHaveLength(10)
      expect(result.pagination.total).toBe(35)
      expect(result.pagination.totalPages).toBe(4)
      expect(result.pagination.hasNextPage).toBe(true)
      expect(result.pagination.hasPreviousPage).toBe(false)
    })

    it('should detect last page', () => {
      const pagination = Pagination.create({ page: 4, pageSize: 10 }).unwrap()
      const data = Array.from({ length: 5 }, (_, i) => ({ id: i }))

      const result = pagination.toResult(data, 35)

      expect(result.pagination.hasNextPage).toBe(false)
      expect(result.pagination.hasPreviousPage).toBe(true)
    })

    it('should handle empty data', () => {
      const pagination = Pagination.create().unwrap()
      const result = pagination.toResult([], 0)

      expect(result.data).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.totalPages).toBe(0)
      expect(result.pagination.hasNextPage).toBe(false)
      expect(result.pagination.hasPreviousPage).toBe(false)
    })

    it('should handle single page', () => {
      const pagination = Pagination.create({ page: 1, pageSize: 20 }).unwrap()
      const data = Array.from({ length: 5 }, (_, i) => ({ id: i }))

      const result = pagination.toResult(data, 5)

      expect(result.pagination.totalPages).toBe(1)
      expect(result.pagination.hasNextPage).toBe(false)
      expect(result.pagination.hasPreviousPage).toBe(false)
    })
  })
})
