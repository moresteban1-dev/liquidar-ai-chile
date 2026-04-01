/**
 * Sparkline — Pure SVG mini chart, zero JS bundle.
 * Server-side renderable. No "use client" needed.
 * Replaces Recharts in KPI cards for performance.
 */

import { cn } from '@/lib/utils';

interface SparklineProps {
    data: number[];
    className?: string;
    /** Stroke color — defaults to currentColor */
    color?: string;
    /** Area fill color — defaults to color with opacity */
    fillColor?: string;
    width?: number;
    height?: number;
    strokeWidth?: number;
}

export function Sparkline({
    data,
    className,
    color = "currentColor",
    fillColor,
    width = 120,
    height = 32,
    strokeWidth = 1.5,
}: SparklineProps) {
    if (data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;

    const points = data.map((value, index) => {
        const x = padding + (index / (data.length - 1)) * (width - padding * 2);
        const y = height - padding - ((value - min) / range) * (height - padding * 2);
        return { x, y };
    });

    const linePath = points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(" ");

    const lastPoint = points[points.length - 1]!;
    const firstPoint = points[0]!;
    const areaPath = `${linePath} L ${lastPoint.x.toFixed(1)} ${height} L ${firstPoint.x.toFixed(1)} ${height} Z`;

    const resolvedFill = fillColor ?? color;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            className={cn("overflow-visible", className)}
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={`spark-fill-${data.length}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={resolvedFill} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={resolvedFill} stopOpacity={0} />
                </linearGradient>
            </defs>
            <path
                d={areaPath}
                fill={`url(#spark-fill-${data.length})`}
            />
            <path
                d={linePath}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Dot on last data point */}
            <circle
                cx={points[points.length - 1]!.x}
                cy={points[points.length - 1]!.y}
                r={2.5}
                fill={color}
            />
        </svg>
    );
}
