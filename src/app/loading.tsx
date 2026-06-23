export default function HomeLoading() {
  return (
    <div className="page-container py-16 section-gap animate-pulse">
      <div className="h-20 w-20 bg-gray-800 rounded-2xl mx-auto mb-6" />
      <div className="h-10 bg-gray-800 rounded-lg max-w-md mx-auto mb-4" />
      <div className="h-4 bg-gray-800/70 rounded max-w-sm mx-auto mb-12" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-72 bg-gray-900/80 border border-gray-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
