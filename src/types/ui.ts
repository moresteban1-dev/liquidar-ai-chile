/**
 * UI Component Types
 * Kaizen Standardized Work: Consistent component interfaces
 */

import { ReactNode } from 'react';

// ============================================
// BUTTON COMPONENT
// ============================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    className?: string;
}

// ============================================
// CARD COMPONENT
// ============================================

export interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    glass?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

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

// ============================================
// TABLE COMPONENT
// ============================================

export interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (item: T) => ReactNode;
    sortable?: boolean;
    width?: string;
}

export interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
}

// ============================================
// MODAL COMPONENT
// ============================================

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showCloseButton?: boolean;
}

// ============================================
// SIDEBAR / NAVIGATION
// ============================================

export interface NavItem {
    label: string;
    href: string;
    icon?: ReactNode;
    badge?: string | number;
    children?: NavItem[];
}

export interface SidebarProps {
    items: NavItem[];
    currentPath: string;
    collapsed?: boolean;
    onToggle?: () => void;
}
