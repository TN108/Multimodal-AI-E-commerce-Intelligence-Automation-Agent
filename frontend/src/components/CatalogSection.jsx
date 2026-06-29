import ProductCard from "./ProductCard";
import GlassCard from "./GlassCard";

function CatalogSection({
  products = [],
  catalogLoading = false,
  onRefreshCatalog,
  onEdit,
  onDelete,
}) {
  return (
    <GlassCard>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-indigo-500">
            Product Catalog
          </p>

          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Saved Products
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
            View, edit, and delete products saved in your authenticated catalog.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefreshCatalog}
          disabled={catalogLoading}
          className="rounded-2xl border border-indigo-300/50 bg-indigo-500/85 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-300/40 ring-1 ring-white/30 backdrop-blur-xl transition hover:bg-indigo-600/90 disabled:bg-indigo-200/60"
        >
          {catalogLoading ? "Refreshing..." : "Refresh Catalog"}
        </button>
      </div>

      {catalogLoading && (
        <div className="rounded-3xl border border-amber-200/70 bg-amber-100/45 p-5 text-sm font-bold text-amber-800 ring-1 ring-white/30 backdrop-blur-2xl">
          Loading saved products...
        </div>
      )}

      {!catalogLoading && products.length === 0 && (
        <div className="rounded-[1.75rem] border border-dashed border-white/35 bg-white/20 p-8 text-center ring-1 ring-white/25 backdrop-blur-2xl">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-slate-400">
            No products yet
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Upload your first product image to build your AI-powered catalog.
          </p>
        </div>
      )}

      {!catalogLoading && products.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product, index) => (
            <ProductCard
              key={product?.id || index}
              product={product}
              showActions={true}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}

export default CatalogSection;