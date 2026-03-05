// Invoices skeleton
export default function InvoicesLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto animate-pulse">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="h-8 w-32 bg-white/10 rounded-lg mb-2" />
          <div className="h-4 w-48 bg-white/5 rounded" />
        </div>
        <div className="h-10 w-32 bg-gold-400/20 rounded-lg" />
      </div>
      <div className="glass-card p-4 mb-6">
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 w-20 bg-white/10 rounded-full" />
          ))}
        </div>
      </div>
      <div className="glass-card">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-b border-white/5">
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-4 bg-white/5 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
