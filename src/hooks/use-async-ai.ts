import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface AsyncAIState<T> {
    data: T | null;
    status: 'idle' | 'submitting' | 'polling' | 'completed' | 'error';
    error: string | null;
}

export function useAsyncAI<TResponse, TInput = unknown>() {
    const [state, setState] = useState<AsyncAIState<TResponse>>({
        data: null,
        status: 'idle',
        error: null,
    });

    // Refs to manage polling interval
    const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const stopPolling = useCallback(() => {
        if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
            pollTimeoutRef.current = null;
        }
    }, []);

    const pollJob = useCallback((jobId: string) => {
        const doPoll = async () => {
            try {
                const res = await fetch(`/api/ai/jobs/${jobId}`);
                if (!res.ok) throw new Error('Failed to check job status');

                const data = await res.json();

                if (data.status === 'completed') {
                    setState({
                        status: 'completed',
                        data: data.result,
                        error: null
                    });
                    return; // Stop polling
                }

                if (data.status === 'failed') {
                    setState({
                        status: 'error',
                        data: null,
                        error: data.error || 'AI Processing Failed'
                    });
                    toast.error('AI Processing Failed: ' + (data.error || 'Unknown error'));
                    return; // Stop polling
                }

                // If pending, poll again in 2s
                setState(prev => ({ ...prev, status: 'polling' }));
                pollTimeoutRef.current = setTimeout(doPoll, 2000);

            } catch (err) {
                logger.error(err instanceof Error ? err.message : String(err));
                setState({
                    status: 'error',
                    data: null,
                    error: 'Connection lost checking status'
                });
                stopPolling();
            }
        };
        
        doPoll();
    }, [stopPolling]);

    const execute = useCallback(async (endpoint: string, payload: TInput) => {
        stopPolling();
        setState({ status: 'submitting', data: null, error: null });

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to submit request');
            }

            const { jobId } = await res.json();

            // Start polling
            setState(prev => ({ ...prev, status: 'polling' }));
            pollJob(jobId);

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Request failed';
            setState({
                status: 'error',
                data: null,
                error: message
            });
            toast.error(message);
        }
    }, [pollJob, stopPolling]);

    // Cleanup on unmount - NASA Grade memory safety
    useEffect(() => {
        return () => {
            stopPolling();
        };
    }, [stopPolling]);

    return {
        ...state,
        execute,
        reset: () => setState({ data: null, status: 'idle', error: null })
    };
}
