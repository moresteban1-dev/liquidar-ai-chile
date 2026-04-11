import { describe, it, expect, vi } from 'vitest';
import { validateRequestBody } from '../api-validator';
import { z } from 'zod';

// Mock NextRequest and NextResponse
class MockNextRequest {
     
    private body: any;
     
    constructor(body: any) {
        this.body = body;
    }
    async json() {
        if (this.body === 'SERVER_ERROR') throw new SyntaxError('Invalid JSON');
        return this.body;
    }
}

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((body, init) => ({ body, status: init?.status ?? 200 }))
    }
}));

const testSchema = z.object({
    name: z.string().min(2),
    age: z.number().int().positive()
});

describe('API Validator: validateRequestBody', () => {

    it('should return success and parsed data for valid input', async () => {
         
        const req = new MockNextRequest({ name: 'Alice', age: 30 }) as any;
        const result = await validateRequestBody(req, testSchema);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.name).toBe('Alice');
            expect(result.data.age).toBe(30);
        }
    });

    it('should return Validation Error (400) for missing fields', async () => {
         
        const req = new MockNextRequest({ name: 'A' }) as any; // Invalid name length and missing age
        const result = await validateRequestBody(req, testSchema);

        expect(result.success).toBe(false);
        if (!result.success && result.response) {
            expect(result.response.status).toBe(400);
             
            const body = result.response.body as any;
            expect(body.error).toBe('Validation Error');
            expect(body.fieldErrors.length).toBeGreaterThan(0);
        }
    });

    it('should return Bad Request (400) for malformed JSON parsing errors', async () => {
         
        const req = new MockNextRequest('SERVER_ERROR') as any;
        const result = await validateRequestBody(req, testSchema);

        expect(result.success).toBe(false);
        if (!result.success && result.response) {
            expect(result.response.status).toBe(400);
             
            const body = result.response.body as any;
            expect(body.error).toBe('Bad Request');
            expect(body.message).toBe('Invalid JSON body');
        }
    });
});
