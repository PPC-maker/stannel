// Events skeleton
export default function EventsLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-28 bg-white/10 rounded-lg mb-2" />
        <div className="h-4 w-56 bg-white/5 rounded" />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card overflow-hidden">
            <div className="aspect-[16/9] bg-white/5" />
            <div className="p-5">
              <div className="flex gap-2 mb-3">
                <div className="h-5 w-16 bg-gold-400/20 rounded-full" />
                <div className="h-5 w-20 bg-white/10 rounded-full" />
              </div>
              <div className="h-6 w-3/4 bg-white/10 rounded mb-2" />
              <div className="h-4 w-full bg-white/5 rounded mb-4" />
              <div className="flex justify-between pt-3 border-t border-white/10">
                <div className="h-4 w-24 bg-white/10 rounded" />
                <div className="h-8 w-20 bg-gold-400/20 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
