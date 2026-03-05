// Dashboard skeleton
export default function DashboardLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-48 bg-white/10 rounded-lg mb-2" />
        <div className="h-4 w-32 bg-white/5 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-4">
            <div className="h-3 w-16 bg-white/10 rounded mb-3" />
            <div className="h-7 w-24 bg-white/10 rounded" />
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="h-5 w-32 bg-white/10 rounded mb-4" />
          <div className="aspect-[1.6/1] bg-white/5 rounded-xl" />
        </div>
        <div className="glass-card p-6 lg:col-span-2">
          <div className="h-5 w-28 bg-white/10 rounded mb-4" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-white/5">
              <div className="w-10 h-10 bg-white/10 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-white/10 rounded mb-2" />
                <div className="h-3 w-20 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
