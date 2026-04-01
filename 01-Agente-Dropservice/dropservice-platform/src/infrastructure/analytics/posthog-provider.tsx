'use client';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';

if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        loaded: (posthog) => {
            // Opt out locally if tracking is not desired during dev
            if (process.env.NODE_ENV === 'development') posthog.opt_out_capturing();
        },
    });
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // For App Router, we just rely on autocapture or manual triggers mostly
    }, []);

    return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
