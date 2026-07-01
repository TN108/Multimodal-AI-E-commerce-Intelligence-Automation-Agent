import {
  getAnalysis,
  getColors,
  getMatchLabel,
  getProductCategory,
  getProductDescription,
  getProductName,
  getProductScore,
} from "../utils/productHelpers";

function ProductCard({ product, onEdit, onDelete, showActions = false }) {
  const analysis = getAnalysis(product);

  return (
    <div className="group rounded-[1.75rem] border border-white/35 bg-white/20 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.18)] ring-1 ring-white/30 backdrop-blur-3xl transition duration-300 hover:-translate-y-1 hover:border-white/50 hover:bg-white/30 hover:shadow-[0_35px_110px_rgba(15,23,42,0.22)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 inline-flex rounded-full border border-indigo-200/70 bg-indigo-100/45 px-3 py-1 text-xs font-black uppercase tracking-wide text-indigo-700 ring-1 ring-white/30 backdrop-blur-xl">
            {getMatchLabel(product)}
          </p>

          <h3 className="text-lg font-black leading-snug text-slate-950">
            {getProductName(product)}
          </h3>

          <p className="mt-1 text-sm font-semibold text-slate-600">
            {getProductCategory(product)}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-emerald-200/70 bg-emerald-100/55 px-3 py-1 text-xs font-black text-emerald-800 shadow-sm ring-1 ring-white/40 backdrop-blur-xl">
          {getProductScore(product)}
        </span>
      </div>

      <p className="text-sm leading-6 text-slate-800">
        {getProductDescription(product)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {analysis?.colors && (
          <span className="rounded-full border border-pink-200/70 bg-pink-100/45 px-3 py-1 text-xs font-bold text-pink-700 ring-1 ring-white/30 backdrop-blur-xl">
            {getColors(analysis)}
          </span>
        )}

        {analysis?.style && (
          <span className="rounded-full border border-violet-200/70 bg-violet-100/45 px-3 py-1 text-xs font-bold text-violet-700 ring-1 ring-white/30 backdrop-blur-xl">
            {analysis.style}
          </span>
        )}

        {analysis?.material_guess && (
          <span className="rounded-full border border-sky-200/70 bg-sky-100/45 px-3 py-1 text-xs font-bold text-sky-700 ring-1 ring-white/30 backdrop-blur-xl">
            {analysis.material_guess}
          </span>
        )}
      </div>

      {showActions && (
        <div className="mt-5 flex flex-wrap gap-3 border-t border-white/30 pt-4">
          <button
            type="button"
            onClick={() => onEdit?.(product)}
            className="rounded-xl border border-slate-300/70 bg-white/55 px-4 py-2 text-sm font-black text-slate-800 shadow-sm ring-1 ring-white/40 backdrop-blur-xl transition hover:bg-white/80"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete?.(product)}
            className="rounded-xl border border-red-300/70 bg-red-100/70 px-4 py-2 text-sm font-black text-red-700 shadow-sm ring-1 ring-white/40 backdrop-blur-xl transition hover:bg-red-200/80"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductCard;