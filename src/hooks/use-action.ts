import {
    useTransition,
    useState,
    useCallback,
    useRef,
    useEffect,
} from 'react';
import type { ActionResponse } from '@/lib/safe-action';

interface UseActionOptions<TOutput> {
    onSuccess?: (data: TOutput) => void;
    onError?: (error: string, code: string) => void;
    onSettled?: () => void;
}

interface UseActionReturn<TInput, TOutput> {
    execute: (input: TInput) => void; // execute is synchronous wrapper around async transition
    data: TOutput | null;
    error: string | null;
    errorCode: string | null;
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    reset: () => void;
}

export function useAction<TInput, TOutput>(
    action: (input: TInput) => Promise<ActionResponse<TOutput>>,
    options: UseActionOptions<TOutput> = {}
): UseActionReturn<TInput, TOutput> {
    const [isPending, startTransition] = useTransition();
    const [data, setData] = useState<TOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Avoid state updates on unmounted components
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const execute = useCallback(
        (input: TInput) => { // Removed async here to match typical event handler signature
            setError(null);
            setErrorCode(null);
            setStatus('idle');

            startTransition(async () => {
                const result = await action(input);

                if (!mountedRef.current) return;

                if (result.status === 'success') {
                    setData(result.data);
                    setStatus('success');
                    options.onSuccess?.(result.data);
                } else {
                    setError(result.error);
                    setErrorCode(result.code);
                    setStatus('error');
                    options.onError?.(result.error || "Uknown Error", result.code);
                }

                options.onSettled?.();
            });
        },
        [action, options]
    );

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setErrorCode(null);
        setStatus('idle');
    }, []);

    return {
        execute,
        data,
        error,
        errorCode,
        isPending,
        isSuccess: status === 'success',
        isError: status === 'error',
        reset,
    };
}
