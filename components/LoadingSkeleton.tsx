export function LoadingSkeleton({ className = "", lines = 1 }: { className?: string; lines?: number }) {
  if (lines === 1) {
    return <div className={`skeleton h-4 rounded ${className}`} />;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-4 rounded ${className}`} />
      ))}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl p-4 animate-pulse">
      <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
      <div className="skeleton h-4 w-3/4 rounded mb-2" />
      <div className="skeleton h-4 w-1/2 rounded" />
    </div>
  );
}