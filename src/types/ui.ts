/**
 * UI Component Types
 * Kaizen Standardized Work: Consistent component interfaces
 */

import { ReactNode } from 'react';

// ============================================
// BADGE / STATUS COMPONENT
// ============================================

export type BadgeStatus = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface BadgeProps {
    label: string;
    status?: BadgeStatus;
    size?: 'sm' | 'md';
}

// ============================================
// DASHBOARD METRICS
// ============================================

export interface MetricCardProps {
    title: string;
    value: string | number;
    change?: {
        value: number;
        trend: 'up' | 'down' | 'neutral';
    };
    icon?: ReactNode;
}
