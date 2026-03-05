// Rewards skeleton
export default function RewardsLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-40 bg-white/10 rounded-lg mb-2" />
        <div className="h-4 w-64 bg-white/5 rounded" />
      </div>
      <div className="glass-card glass-card-gold p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-4 w-24 bg-white/10 rounded mb-2" />
            <div className="h-10 w-32 bg-gold-400/20 rounded" />
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card overflow-hidden">
            <div className="aspect-video bg-white/5" />
            <div className="p-4">
              <div className="h-5 w-3/4 bg-white/10 rounded mb-2" />
              <div className="h-4 w-full bg-white/5 rounded mb-4" />
              <div className="flex justify-between">
                <div className="h-6 w-20 bg-gold-400/20 rounded" />
                <div className="h-8 w-24 bg-white/10 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
