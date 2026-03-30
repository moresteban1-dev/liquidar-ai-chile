'use client';

import dynamic from 'next/dynamic';
import { SkeletonLine } from '@/components/ui/skeleton';

const OptimizationPanel = dynamic(() => import('./OptimizationPanel'), {
  loading: () => <SkeletonLine height="200px" />,
  ssr: false
});

const NotificationLogPanel = dynamic(() => import('./NotificationLogPanel'), {
  loading: () => <SkeletonLine height="300px" />,
  ssr: false
});

export function DashboardOptimizationPanel() {
  return <OptimizationPanel />;
}

export function DashboardNotificationLogPanel() {
  return <NotificationLogPanel />;
}
