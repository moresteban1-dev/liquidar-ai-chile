import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getQueue, QUEUE_NAMES } from '@infrastructure/queue/queue.factory';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { withAuth } from '@/lib/api/with-auth';

export const POST = withAuth(async (request, _user) => {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { get: (name) => cookieStore.get(name)?.value } }
        );

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, orderId, data } = await request.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // Initialize input for Genkit Flow
        const flowInput = {
            messages: [{ role: "user" as const, content: message }],
            orderId: orderId || "default-order",
            data: data || {},
        };

        const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();

        // Add to Queue instead of awaiting directly
        const queue = getQueue(QUEUE_NAMES.AI_PROCESSING);
        const job = await queue.add('liquidarAgent', {
            flowName: 'liquidarAgent',
            input: flowInput,
            correlationId
        });

        logger.info(`[API] Enqueued AI Job: ${job.id}`, { correlationId });

        return NextResponse.json({
            jobId: job.id,
            status: 'queued',
            message: "Request queued for processing"
        }, { status: 202 }); // 202 Accepted

    } catch (error: unknown) {
        logger.error("Agent API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Agent Error";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
});
