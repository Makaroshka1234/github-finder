'use client';

export function LoadingSkeletons() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="p-4 border border-gray-200 rounded-lg animate-pulse"
        >
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            {/* Avatar placeholder */}
            <div className="w-12 h-12 bg-gray-300 rounded-full shrink-0" />

            {/* Title and subtitle placeholders */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-2/3" />
              <div className="h-3 bg-gray-300 rounded w-1/3" />
            </div>
          </div>

          {/* Description placeholders */}
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-gray-300 rounded w-full" />
            <div className="h-3 bg-gray-300 rounded w-4/5" />
          </div>

          {/* Stats placeholders */}
          <div className="flex gap-4">
            <div className="h-3 bg-gray-300 rounded w-12" />
            <div className="h-3 bg-gray-300 rounded w-12" />
            <div className="h-3 bg-gray-300 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
