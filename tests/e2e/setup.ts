import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, afterAll, beforeEach } from 'vitest'

/**
 * E2E Test Setup
 * 
 * Configura ambiente de pruebas end-to-end con:
 * - Base de datos real (Supabase)
 * - Cliente HTTP para API
 * - Limpieza de datos entre tests
 */

let supabaseClient: SupabaseClient

export function setupE2ETests() {
  beforeAll(() => {
    // Verificar variables de entorno
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables for E2E tests')
    }

    // Crear cliente de Supabase
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('✅ E2E Test environment initialized')
  })

  beforeEach(async () => {
    // Limpiar datos de test antes de cada prueba
    await cleanupTestData()
  })

  afterAll(async () => {
    // Limpieza final
    await cleanupTestData()
    console.log('✅ E2E Test environment cleaned up')
  })

  return { getSupabaseClient: () => supabaseClient }
}

async function cleanupTestData() {
  const client = supabaseClient

  if (!client) return

  try {
    // Eliminar datos de test (identificados por prefijo 'e2e-test-')
    // Nota: Usamos deletions manuales para asegurar limpieza en ambiente real
    await client.from('order_pricing').delete().like('order_id', 'e2e-test-%')
    await client.from('quotation_pricing').delete().like('quotation_id', 'e2e-test-%')
    await client.from('quotations').delete().like('id', 'e2e-test-%')
    await client.from('orders').delete().like('id', 'e2e-test-%')
    await client.from('domain_events').delete().like('aggregate_id', 'e2e-test-%')
  } catch (error) {
    console.warn('Cleanup warning:', error)
  }
}

/**
 * HTTP Client helper para tests
 */
export class E2EHttpClient {
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl
  }

  async post<T = any>(path: string, body: any): Promise<{
    status: number
    data: T
    headers: Headers
  }> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    return {
      status: response.status,
      data,
      headers: response.headers
    }
  }

  async get<T = any>(path: string): Promise<{
    status: number
    data: T
    headers: Headers
  }> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    return {
      status: response.status,
      data,
      headers: response.headers
    }
  }

  async patch<T = any>(path: string, body: any): Promise<{
    status: number
    data: T
    headers: Headers
  }> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    return {
      status: response.status,
      data,
      headers: response.headers
    }
  }

  async delete<T = any>(path: string): Promise<{
    status: number
    data: T
    headers: Headers
  }> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    return {
      status: response.status,
      data,
      headers: response.headers
    }
  }
}
