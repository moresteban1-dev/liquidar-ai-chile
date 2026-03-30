import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as AgentPOST } from '@/app/api/ai/agent/route';
import { GET as JobGET } from '@/app/api/ai/jobs/[jobId]/route';
import { NextRequest } from 'next/server';


// Mock Queue
const mockAdd = vi.fn();
const mockJob = {
    id: 'job-123',
    getState: vi.fn(),
    returnvalue: { response: 'Hello' },
    failedReason: null,
    progress: 0
};

vi.mock('@/infrastructure/queue/queue.factory', () => ({
    QUEUE_NAMES: { AI_PROCESSING: 'ai-processing' },
    getQueue: vi.fn(() => ({
        add: mockAdd.mockResolvedValue({ id: 'job-123' })
    }))
}));

vi.mock('bullmq', () => ({
    Job: {
        fromId: vi.fn(() => Promise.resolve(mockJob))
    }
}));

describe('Async AI Agent API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('POST /agent queues a job and returns jobId', async () => {
        const req = new NextRequest('http://localhost/api/ai/agent', {
            method: 'POST',
            body: JSON.stringify({ message: 'Hello AI' })
        });

        const res = await AgentPOST(req);
        const data = await res.json();

        expect(res.status).toBe(202);
        expect(data.jobId).toBe('job-123');
        expect(data.status).toBe('queued');
        expect(mockAdd).toHaveBeenCalledWith('dropServiceAgent', expect.objectContaining({
            input: expect.objectContaining({
                messages: [{ role: 'user', content: 'Hello AI' }]
            })
        }));
    });

    it('GET /jobs/[id] returns pending status initially', async () => {
        mockJob.getState.mockResolvedValue('waiting');

        const req = new NextRequest('http://localhost/api/ai/jobs/job-123');
        // Mock params
        const params = Promise.resolve({ jobId: 'job-123' });

        const res = await JobGET(req, { params });
        const data = await res.json();

        expect(data.status).toBe('pending');
    });

    it('GET /jobs/[id] returns result when completed', async () => {
        mockJob.getState.mockResolvedValue('completed');
        mockJob.returnvalue = { response: 'AI Response' };

        const req = new NextRequest('http://localhost/api/ai/jobs/job-123');
        const params = Promise.resolve({ jobId: 'job-123' });

        const res = await JobGET(req, { params });
        const data = await res.json();

        expect(data.status).toBe('completed');
        expect(data.result).toEqual({ response: 'AI Response' });
    });
});
