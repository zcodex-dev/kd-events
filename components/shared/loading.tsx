export function LoadingSpinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      className="animate-spin text-neutral-400"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size={28} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 px-4 animate-pulse">
          <div className="w-10 h-10 bg-neutral-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-neutral-100 w-1/3" />
            <div className="h-3 bg-neutral-50 w-1/4" />
          </div>
          <div className="h-3 bg-neutral-100 w-16" />
        </div>
      ))}
    </div>
  );
}
