const SkeletonLoader = ({ count = 3, type = "card" }) => {
  if (type === "card") {
    return (
      <div className="space-y-4">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="card bg-base-200 animate-pulse p-6 h-24">
            <div className="h-4 bg-base-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-base-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className="space-y-2">
        {[...Array(count)].map((_, i) => (
          <div
            key={i}
            className="flex gap-4 p-4 bg-base-200 rounded animate-pulse"
          >
            <div className="h-4 bg-base-300 rounded w-1/4"></div>
            <div className="h-4 bg-base-300 rounded w-1/4"></div>
            <div className="h-4 bg-base-300 rounded w-1/4"></div>
            <div className="h-4 bg-base-300 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  // Default: simple spinner
  return (
    <div className="flex justify-center items-center p-8">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );
};

export default SkeletonLoader;
