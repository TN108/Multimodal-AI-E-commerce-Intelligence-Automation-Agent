import { useEffect, useState } from "react";
import {
  searchByText,
  searchByImage,
  analyzeAndSaveProduct,
} from "./api/multimodalApi";

const MIN_SCORE = 0.5;

const HERO_SLIDES = [
  {
    title: "AI-Powered Catalog Intelligence",
    subtitle:
      "Turn product images into rich, searchable catalog data with a clean and automated workflow.",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Visual Product Discovery",
    subtitle:
      "Help users find relevant products faster with intuitive text and image-based search.",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Smarter Search Experience",
    subtitle:
      "Deliver better product matching and more meaningful results across your inventory.",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80",
  },
];

function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-[2rem] border border-white/35 bg-white/20 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.18)] ring-1 ring-white/30 backdrop-blur-3xl transition duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

function Field({ label, value }) {
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

function RawJsonViewer({ title, data }) {
  if (!data) return null;

  return (
    <details className="mt-5">
      <summary className="cursor-pointer text-sm font-bold text-slate-600 transition hover:text-slate-950">
        {title}
      </summary>

      <pre className="mt-3 max-h-96 overflow-x-auto rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-xs leading-5 text-emerald-200 shadow-inner backdrop-blur-2xl">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

function getResultsArray(data) {
  return data?.results || data?.matches || data?.products || [];
}

function getPayload(product) {
  return product?.payload || product || {};
}

function getAnalysis(product) {
  const payload = getPayload(product);
  return payload?.vlm_analysis || product?.vlm_analysis || {};
}

function getProductName(product) {
  const payload = getPayload(product);
  const analysis = getAnalysis(product);

  return (
    product?.name ||
    payload?.name ||
    payload?.product_name ||
    payload?.title ||
    analysis?.product_type ||
    analysis?.style ||
    "Unnamed Product"
  );
}

function getProductCategory(product) {
  const payload = getPayload(product);
  const analysis = getAnalysis(product);

  return (
    product?.category ||
    payload?.category ||
    payload?.product_type ||
    analysis?.category ||
    analysis?.product_type ||
    "Unknown Category"
  );
}

function getProductDescription(product) {
  const payload = getPayload(product);
  const analysis = getAnalysis(product);

  return (
    product?.description ||
    payload?.description ||
    payload?.short_description ||
    analysis?.short_description ||
    payload?.search_text ||
    "No description available."
  );
}

function getProductScore(product) {
  if (product?.score !== undefined) return Number(product.score).toFixed(3);

  if (product?.similarity !== undefined) {
    return Number(product.similarity).toFixed(3);
  }

  return "N/A";
}

function getColors(analysis) {
  if (Array.isArray(analysis?.colors)) {
    return analysis.colors.join(", ");
  }

  return "N/A";
}

function getSearchTags(analysis) {
  if (Array.isArray(analysis?.search_tags)) {
    return analysis.search_tags.join(", ");
  }

  return "N/A";
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getDuplicateKey(product) {
  const payload = getPayload(product);
  const analysis = getAnalysis(product);

  const name = getProductName(product);
  const category = getProductCategory(product);
  const productType = analysis?.product_type || payload?.product_type || "";
  const style = analysis?.style || "";
  const colors = Array.isArray(analysis?.colors)
    ? analysis.colors.join(" ")
    : "";

  return normalizeText(`${name} ${category} ${productType} ${style} ${colors}`);
}

function removeDuplicateProducts(products) {
  const seen = new Set();

  return products.filter((product) => {
    const key = getDuplicateKey(product);

    if (!key) return true;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function filterStrongResults(data) {
  const strongResults = getResultsArray(data).filter((product) => {
    const score = product?.score ?? product?.similarity ?? 0;
    return score >= MIN_SCORE;
  });

  return removeDuplicateProducts(strongResults);
}

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

function ProductCard({ product }) {
  const analysis = getAnalysis(product);

  return (
    <div className="group rounded-[1.75rem] border border-white/35 bg-white/20 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.18)] ring-1 ring-white/30 backdrop-blur-3xl transition duration-300 hover:-translate-y-1 hover:border-white/50 hover:bg-white/30 hover:shadow-[0_35px_110px_rgba(15,23,42,0.22)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
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

      <RawJsonViewer title="View technical result" data={product} />
    </div>
  );
}

function App() {
  const [query, setQuery] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [imageSearchPreview, setImageSearchPreview] = useState("");

  const [addProductFile, setAddProductFile] = useState(null);
  const [addProductPreview, setAddProductPreview] = useState("");
  const [saveResult, setSaveResult] = useState(null);

  const [results, setResults] = useState([]);
  const [vlmAnalysis, setVlmAnalysis] = useState(null);

  const [searchLoading, setSearchLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [error, setError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentSlide((previousSlide) =>
        previousSlide === HERO_SLIDES.length - 1 ? 0 : previousSlide + 1
      );
    }, 4500);

    return () => clearInterval(intervalId);
  }, []);

  const activeSlide = HERO_SLIDES[currentSlide];

  const getSaveAnalysis = () => {
    return saveResult?.vlm_analysis || saveResult?.analysis || null;
  };

  const handleAddProductImageChange = (event) => {
    const file = event.target.files?.[0];

    setError("");
    setSaveResult(null);

    if (!file) {
      setAddProductFile(null);
      setAddProductPreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setAddProductFile(null);
      setAddProductPreview("");
      setError("Please select a valid product image.");
      return;
    }

    setAddProductFile(file);
    setAddProductPreview(URL.createObjectURL(file));
  };

  const handleImageSearchFileChange = (event) => {
    const file = event.target.files?.[0];

    setError("");

    if (!file) {
      setSelectedFile(null);
      setImageSearchPreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSelectedFile(null);
      setImageSearchPreview("");
      setError("Please select a valid image file.");
      return;
    }

    setSelectedFile(file);
    setImageSearchPreview(URL.createObjectURL(file));
  };

  const handleAnalyzeAndSaveProduct = async () => {
    if (!addProductFile) {
      setError("Please select a product image first.");
      return;
    }

    setSaveLoading(true);
    setError("");
    setSaveResult(null);

    try {
      const data = await analyzeAndSaveProduct(addProductFile);

      console.log("Analyze and save response:", data);

      setSaveResult(data);
    } catch (error) {
      console.error("Analyze and save failed:", error);

      const backendMessage =
        error.response?.data?.detail ||
        "Analyze and save failed. Check backend, database, AI service, and CORS.";

      setError(backendMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleTextSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a search query.");
      return;
    }

    setSearchLoading(true);
    setError("");
    setVlmAnalysis(null);
    setResults([]);

    try {
      const data = await searchByText(query);

      console.log("Text search response:", data);

      setResults(filterStrongResults(data));
    } catch (error) {
      console.error("Text search failed:", error);

      const backendMessage =
        error.response?.data?.detail ||
        "Text search failed. Check backend, database, and CORS.";

      setError(backendMessage);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleImageSearch = async () => {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }

    setSearchLoading(true);
    setError("");
    setVlmAnalysis(null);
    setResults([]);

    try {
      const data = await searchByImage(selectedFile);

      console.log("Image search response:", data);

      setVlmAnalysis(data?.vlm_analysis || data?.analysis || null);
      setResults(filterStrongResults(data));
    } catch (error) {
      console.error("Image search failed:", error);

      const backendMessage =
        error.response?.data?.detail ||
        "Image search failed. Check backend, database, AI service, and CORS.";

      setError(backendMessage);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-200 via-sky-200 to-violet-300 px-4 py-8 text-slate-950 md:px-8">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute -left-32 top-24 h-[30rem] w-[30rem] rounded-full bg-pink-300/70 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[32rem] w-[32rem] rounded-full bg-sky-300/70 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[30rem] w-[30rem] rounded-full bg-violet-300/70 blur-3xl" />
      </div>

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.55),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.40),transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl">
        <section className="mb-8 overflow-hidden rounded-[2.5rem] border border-white/35 bg-white/20 shadow-[0_35px_120px_rgba(15,23,42,0.22)] ring-1 ring-white/30 backdrop-blur-3xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-8 md:p-10">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">
                AI-Powered Commerce Platform
              </p>

              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
                Multimodal Product Intelligence
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700">
                Transform your catalog with AI-powered product understanding,
                intelligent search, and seamless visual discovery.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <span className="rounded-full border border-pink-200/70 bg-pink-100/45 px-4 py-2 text-sm font-bold text-pink-700 ring-1 ring-white/30 backdrop-blur-xl">
                  Smart Analysis
                </span>

                <span className="rounded-full border border-sky-200/70 bg-sky-100/45 px-4 py-2 text-sm font-bold text-sky-700 ring-1 ring-white/30 backdrop-blur-xl">
                  Visual Search
                </span>

                <span className="rounded-full border border-violet-200/70 bg-violet-100/45 px-4 py-2 text-sm font-bold text-violet-700 ring-1 ring-white/30 backdrop-blur-xl">
                  Relevant Results
                </span>

                <span className="rounded-full border border-emerald-200/70 bg-emerald-100/45 px-4 py-2 text-sm font-bold text-emerald-700 ring-1 ring-white/30 backdrop-blur-xl">
                  Catalog Intelligence
                </span>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3">
                <div className="rounded-3xl border border-white/35 bg-white/20 p-4 shadow-sm ring-1 ring-white/30 backdrop-blur-2xl">
                  <p className="text-2xl font-black text-slate-950">01</p>

                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Upload
                  </p>
                </div>

                <div className="rounded-3xl border border-white/35 bg-white/20 p-4 shadow-sm ring-1 ring-white/30 backdrop-blur-2xl">
                  <p className="text-2xl font-black text-slate-950">02</p>

                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Enrich
                  </p>
                </div>

                <div className="rounded-3xl border border-white/35 bg-white/20 p-4 shadow-sm ring-1 ring-white/30 backdrop-blur-2xl">
                  <p className="text-2xl font-black text-slate-950">03</p>

                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Discover
                  </p>
                </div>
              </div>
            </div>

            <div className="relative min-h-[360px] overflow-hidden lg:min-h-full">
              <img
                src={activeSlide.image}
                alt={activeSlide.title}
                className="absolute inset-0 h-full w-full object-cover transition duration-700"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-white/10" />

              <div className="absolute bottom-6 left-6 right-6 rounded-[1.75rem] border border-white/30 bg-white/20 p-5 text-white shadow-2xl ring-1 ring-white/20 backdrop-blur-3xl">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
                  Platform Highlights
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  {activeSlide.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/80">
                  {activeSlide.subtitle}
                </p>

                <div className="mt-4 flex gap-2">
                  {HERO_SLIDES.map((slide, index) => (
                    <button
                      key={slide.title}
                      type="button"
                      onClick={() => setCurrentSlide(index)}
                      className={`h-2.5 rounded-full transition ${
                        currentSlide === index
                          ? "w-9 bg-white"
                          : "w-2.5 bg-white/40"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-8 rounded-3xl border border-rose-200/70 bg-rose-100/45 p-4 text-sm font-bold text-rose-800 shadow-sm ring-1 ring-white/30 backdrop-blur-2xl">
            {error}
          </div>
        )}

        <GlassCard className="mb-8">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-600">
                Catalog Intake
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Add Product
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                Upload a product image and convert it into an intelligent,
                searchable catalog entry.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-100/45 px-4 py-3 text-sm font-bold text-emerald-800 ring-1 ring-white/30 backdrop-blur-xl">
              Upload → Analyze → Save
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
            <div className="rounded-[2rem] border border-dashed border-emerald-200/70 bg-emerald-100/25 p-5 ring-1 ring-white/25 backdrop-blur-2xl">
              <input
                type="file"
                accept="image/*"
                onChange={handleAddProductImageChange}
                className="w-full rounded-2xl border border-white/40 bg-white/30 px-4 py-3 text-sm text-slate-800 ring-1 ring-white/30 backdrop-blur-2xl file:mr-4 file:rounded-full file:border-0 file:bg-emerald-100/70 file:px-4 file:py-2 file:text-sm file:font-bold file:text-emerald-800"
              />

              {addProductPreview ? (
                <div className="mt-5">
                  <p className="mb-2 text-sm font-black text-slate-800">
                    Product Preview
                  </p>

                  <img
                    src={addProductPreview}
                    alt="Product preview"
                    className="h-72 w-full rounded-[1.75rem] border border-white/40 bg-white/20 object-contain shadow-inner ring-1 ring-white/30 backdrop-blur-2xl"
                  />
                </div>
              ) : (
                <div className="mt-5 flex h-72 items-center justify-center rounded-[1.75rem] border border-white/35 bg-white/20 text-center text-sm font-semibold text-slate-500 ring-1 ring-white/25 backdrop-blur-2xl">
                  Product preview will appear here.
                </div>
              )}

              <button
                onClick={handleAnalyzeAndSaveProduct}
                disabled={saveLoading}
                className="mt-5 w-full rounded-2xl border border-emerald-300/50 bg-emerald-500/80 px-6 py-3 font-black text-white shadow-lg shadow-emerald-300/40 ring-1 ring-white/30 backdrop-blur-xl transition hover:bg-emerald-600/90 disabled:bg-emerald-200/60"
              >
                {saveLoading ? "Processing Product..." : "Analyze & Save"}
              </button>
            </div>

            <div>
              {saveLoading && (
                <div className="rounded-3xl border border-amber-200/70 bg-amber-100/45 p-5 text-sm font-bold text-amber-800 ring-1 ring-white/30 backdrop-blur-2xl">
                  Creating an intelligent catalog entry...
                </div>
              )}

              {saveResult && (
                <div className="space-y-5">
                  <div className="rounded-3xl border border-emerald-200/70 bg-emerald-100/45 p-5 text-sm font-bold text-emerald-800 ring-1 ring-white/30 backdrop-blur-2xl">
                    Product has been analyzed and saved successfully.
                  </div>

                  {getSaveAnalysis() && (
                    <div className="rounded-[1.75rem] border border-white/35 bg-white/20 p-5 shadow-sm ring-1 ring-white/30 backdrop-blur-2xl">
                      <h3 className="text-xl font-black text-slate-950">
                        Product Analysis
                      </h3>

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Field
                          label="Product Type"
                          value={getSaveAnalysis()?.product_type}
                        />

                        <Field
                          label="Category"
                          value={getSaveAnalysis()?.category}
                        />

                        <Field
                          label="Audience"
                          value={getSaveAnalysis()?.gender}
                        />

                        <Field
                          label="Style"
                          value={getSaveAnalysis()?.style}
                        />

                        <Field
                          label="Material"
                          value={getSaveAnalysis()?.material_guess}
                        />

                        <Field
                          label="Colors"
                          value={getColors(getSaveAnalysis())}
                        />
                      </div>

                      <div className="mt-4 rounded-2xl border border-violet-200/50 bg-violet-100/35 p-4 text-sm text-slate-800 ring-1 ring-white/25 backdrop-blur-2xl">
                        <strong>Product Keywords:</strong>{" "}
                        {getSearchTags(getSaveAnalysis())}
                      </div>

                      <div className="mt-4 rounded-2xl border border-sky-200/50 bg-sky-100/35 p-4 text-sm leading-6 text-slate-800 ring-1 ring-white/25 backdrop-blur-2xl">
                        <strong>Description:</strong>{" "}
                        {getSaveAnalysis()?.short_description || "N/A"}
                      </div>
                    </div>
                  )}

                  {saveResult.search_text && (
                    <div className="rounded-[1.75rem] border border-sky-200/50 bg-sky-100/35 p-5 ring-1 ring-white/25 backdrop-blur-2xl">
                      <h3 className="text-lg font-black text-slate-950">
                        Searchable Catalog Summary
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-800">
                        {saveResult.search_text}
                      </p>
                    </div>
                  )}

                  <RawJsonViewer
                    title="View technical save response"
                    data={saveResult}
                  />
                </div>
              )}

              {!saveLoading && !saveResult && (
                <div className="flex h-full min-h-72 items-center justify-center rounded-[1.75rem] border border-white/35 bg-white/20 p-8 text-center ring-1 ring-white/25 backdrop-blur-2xl">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.28em] text-slate-400">
                      Waiting for upload
                    </p>

                    <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
                      Select a product image to create a searchable catalog
                      profile.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
          <GlassCard>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-pink-500">
              Text Discovery
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Search by Text
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              Type a natural product query to find the most relevant catalog
              matches.
            </p>

            <input
              type="text"
              placeholder="Example: pink floral top"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="mt-5 w-full rounded-2xl border border-pink-200/60 bg-white/25 px-4 py-3 text-slate-900 outline-none shadow-sm ring-1 ring-white/30 backdrop-blur-2xl transition placeholder:text-slate-500 focus:border-pink-300/80 focus:bg-white/35 focus:ring-4 focus:ring-pink-200/45"
            />

            <button
              onClick={handleTextSearch}
              disabled={searchLoading}
              className="mt-4 w-full rounded-2xl border border-slate-700/30 bg-slate-950/90 px-6 py-3 font-black text-white shadow-lg shadow-slate-400/25 ring-1 ring-white/20 backdrop-blur-xl transition hover:bg-slate-800 disabled:bg-slate-400/60"
            >
              {searchLoading ? "Searching..." : "Search Catalog"}
            </button>
          </GlassCard>

          <GlassCard>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-sky-500">
              Visual Discovery
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Search by Image
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              Upload a product image to discover visually and semantically
              similar items.
            </p>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageSearchFileChange}
              className="mt-5 w-full rounded-2xl border border-sky-200/60 bg-white/25 px-4 py-3 text-sm text-slate-800 ring-1 ring-white/30 backdrop-blur-2xl file:mr-4 file:rounded-full file:border-0 file:bg-sky-100/70 file:px-4 file:py-2 file:text-sm file:font-bold file:text-sky-800"
            />

            {imageSearchPreview && (
              <img
                src={imageSearchPreview}
                alt="Search preview"
                className="mt-4 h-48 w-full rounded-[1.75rem] border border-white/35 bg-white/20 object-contain shadow-inner ring-1 ring-white/25 backdrop-blur-2xl"
              />
            )}

            <button
              onClick={handleImageSearch}
              disabled={searchLoading}
              className="mt-4 w-full rounded-2xl border border-sky-300/50 bg-sky-500/85 px-6 py-3 font-black text-white shadow-lg shadow-sky-300/40 ring-1 ring-white/30 backdrop-blur-xl transition hover:bg-sky-600/90 disabled:bg-sky-200/60"
            >
              {searchLoading ? "Processing..." : "Find Similar Products"}
            </button>
          </GlassCard>
        </div>

        {searchLoading && (
          <div className="mb-8 rounded-3xl border border-amber-200/70 bg-amber-100/45 p-4 text-sm font-bold text-amber-800 ring-1 ring-white/30 backdrop-blur-2xl">
            Searching for relevant product matches...
          </div>
        )}

        <ProductAnalysisCard
          title="Image Search Analysis"
          analysis={vlmAnalysis}
        />

        <GlassCard>
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-500">
                Discovery Output
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Search Results
              </h2>
            </div>

            <span className="rounded-full border border-violet-200/70 bg-violet-100/45 px-4 py-2 text-sm font-bold text-violet-800 ring-1 ring-white/30 backdrop-blur-xl">
              Relevance threshold: {MIN_SCORE}
            </span>
          </div>

          {results.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-white/35 bg-white/20 p-8 text-center ring-1 ring-white/25 backdrop-blur-2xl">
              <p className="text-sm font-black uppercase tracking-[0.28em] text-slate-400">
                No strong results
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Search by text or image after adding products. Low-confidence
                matches are hidden for cleaner results.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {results.map((product, index) => (
                <ProductCard key={index} product={product} />
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

export default App;