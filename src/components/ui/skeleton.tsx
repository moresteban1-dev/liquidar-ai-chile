/**
 * Lightweight skeleton components for streaming/loading states.
 * Pure CSS animations — zero JS bundle cost.
 * These render on the server and show while Suspense resolves.
 */

export function SkeletonLine({ width = '100%', height = '16px' }: {
  width?: string;
  height?: string;
}) {
  return (
    <div
      className="skeleton-line"
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/**
 * Generic Skeleton component for compatibility with shadcn-style imports.
 */
export function Skeleton({ className = '', ...props }: any) {
  return <div className={`skeleton-line ${className}`} {...props} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <SkeletonLine width="60%" height="20px" />
      <SkeletonLine width="40%" height="14px" />
      <SkeletonLine width="80%" height="14px" />
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <SkeletonLine width="80px" height="28px" />
        <SkeletonLine width="100px" height="28px" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="skeleton-table" aria-hidden="true">
      <div className="skeleton-table-header">
        <SkeletonLine width="100%" height="40px" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton-table-row">
          <SkeletonLine width="100%" height="52px" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="skeleton-dashboard" aria-hidden="true">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton-stat-card">
            <SkeletonLine width="50%" height="14px" />
            <SkeletonLine width="70%" height="32px" />
          </div>
        ))}
      </div>
      <div style={{ marginTop: '24px' }}>
        <SkeletonTable rows={8} />
      </div>
    </div>
  );
}

export function SkeletonOrderDetail() {
  return (
    <div className="skeleton-order-detail" aria-hidden="true">
      <SkeletonLine width="40%" height="28px" />
      <SkeletonLine width="20%" height="20px" />
      <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div style={{ marginTop: '24px' }}>
        <SkeletonTable rows={3} />
      </div>
    </div>
  );
}
