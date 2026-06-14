import GlassCard, { Field } from "./GlassCard";
import RawJsonViewer from "./RawJsonViewer";
import { getColors, getSearchTags } from "../utils/productHelpers";

function ProductAnalysisCard({ title, analysis }) {
  if (!analysis) return null;

  return (
    <GlassCard className="mb-8">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-pink-500">
            Product Intelligence
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-950">{title}</h2>
        </div>

        <span className="rounded-full border border-emerald-200/70 bg-emerald-100/50 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-800 shadow-sm ring-1 ring-white/30 backdrop-blur-xl">
          Analysis Ready
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label="Product Type" value={analysis.product_type} />
        <Field label="Category" value={analysis.category} />
        <Field label="Audience" value={analysis.gender} />
        <Field label="Style" value={analysis.style} />
        <Field label="Material" value={analysis.material_guess} />
        <Field label="Colors" value={getColors(analysis)} />
      </div>

      <div className="mt-4 rounded-2xl border border-violet-200/50 bg-violet-100/35 p-4 ring-1 ring-white/25 backdrop-blur-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-600">
          Product Keywords
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-800">
          {getSearchTags(analysis)}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-sky-200/50 bg-sky-100/35 p-4 ring-1 ring-white/25 backdrop-blur-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600">
          Product Description
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-800">
          {analysis.short_description || "N/A"}
        </p>
      </div>

      <RawJsonViewer title="View technical response" data={analysis} />
    </GlassCard>
  );
}

export default ProductAnalysisCard;