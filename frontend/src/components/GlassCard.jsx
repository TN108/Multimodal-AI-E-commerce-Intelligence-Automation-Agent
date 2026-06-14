function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-[2rem] border border-white/35 bg-white/20 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.18)] ring-1 ring-white/30 backdrop-blur-3xl transition duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/35 bg-white/25 px-4 py-3 shadow-sm ring-1 ring-white/25 backdrop-blur-2xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value || "N/A"}
      </p>
    </div>
  );
}

export default GlassCard;