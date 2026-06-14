import GlassCard from "./GlassCard";
import ProductCard from "./ProductCard";

function CatalogSection({ products, catalogLoading, onRefreshCatalog }) {
  return (
    <GlassCard className="mb-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-indigo-500">
            Saved Catalog
          </p>

          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Product Catalog
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
            View products already saved in your catalog.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="rounded-full border border-indigo-200/70 bg-indigo-100/45 px-4 py-2 text-sm font-bold text-indigo-800 ring-1 ring-white/30 backdrop-blur-xl">
            {products.length} saved products
          </span>

          <button
            onClick={onRefreshCatalog}
            disabled={catalogLoading}
            className="rounded-2xl border border-indigo-300/50 bg-indigo-500/85 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-300/40 ring-1 ring-white/30 backdrop-blur-xl transition hover:bg-indigo-600/90 disabled:bg-indigo-200/60"
          >
            {catalogLoading ? "Refreshing..." : "Refresh Catalog"}
          </button>
        </div>
      </div>

      {catalogLoading && (
        <div className="rounded-3xl border border-amber-200/70 bg-amber-100/45 p-4 text-sm font-bold text-amber-800 ring-1 ring-white/30 backdrop-blur-2xl">
          Loading saved catalog products...
        </div>
      )}

      {!catalogLoading && products.length === 0 && (
        <div className="rounded-[1.75rem] border border-dashed border-white/35 bg-white/20 p-8 text-center ring-1 ring-white/25 backdrop-blur-2xl">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-slate-400">
            No saved products yet
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Add a product first, then refresh the catalog.
          </p>
        </div>
      )}

      {!catalogLoading && products.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {products.map((product, index) => (
            <ProductCard key={product?.id || product?.point_id || index} product={product} />
          ))}
        </div>
      )}
    </GlassCard>
  );
}

export default CatalogSection;