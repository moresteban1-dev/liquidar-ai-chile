import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { getQueue, QUEUE_NAMES } from '@infrastructure/queue/queue.factory';
import { Job } from 'bullmq';
import { withAuth } from '@/lib/api/with-auth';

export const GET = withAuth(async (_request, _user, params) => {
    try {
        const jobId = params?.jobId;
        if (!jobId) {
            return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
        }
        
        const queue = getQueue(QUEUE_NAMES.AI_PROCESSING);
        const job = await Job.fromId(queue, jobId);

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        const state = await job.getState();
        const result = job.returnvalue;
        const failedReason = job.failedReason;

        if (state === 'completed') {
            return NextResponse.json({
                status: 'completed',
                result
            });
        }

        if (state === 'failed') {
            return NextResponse.json({
                status: 'failed',
                error: failedReason || "Unknown job failure"
            });
        }

        return NextResponse.json({
            status: 'pending',
            progress: job.progress
        });

    } catch (error) {
        logger.error("[JobAPI] Error fetching job:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
});
