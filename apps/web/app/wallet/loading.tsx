// Wallet skeleton
export default function WalletLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-36 bg-white/10 rounded-lg mb-2" />
        <div className="h-4 w-48 bg-white/5 rounded" />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-card glass-card-gold p-6">
          <div className="h-5 w-32 bg-white/10 rounded mb-4" />
          <div className="aspect-[1.6/1] bg-primary-500/30 rounded-xl" />
        </div>
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5">
              <div className="h-4 w-20 bg-white/10 rounded mb-3" />
              <div className="h-8 w-28 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 glass-card p-6">
        <div className="h-6 w-32 bg-white/10 rounded mb-6" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-white/5">
            <div className="w-10 h-10 bg-white/10 rounded-lg" />
            <div className="flex-1">
              <div className="h-4 w-40 bg-white/10 rounded mb-2" />
              <div className="h-3 w-24 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
