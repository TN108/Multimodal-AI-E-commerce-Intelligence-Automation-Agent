import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { searchByText, searchByImage } from "../api/multimodalApi";
import { updateProduct, deleteProduct } from "../api/productApi";

import GlassCard, { Field } from "../components/GlassCard";
import ProductAnalysisCard from "../components/ProductAnalysisCard";
import ProductCard from "../components/ProductCard";
import RawJsonViewer from "../components/RawJsonViewer";
import CatalogSection from "../components/CatalogSection";

import {
  filterStrongResults,
  getColors,
  getSearchTags,
  getResultsArray,
} from "../utils/productHelpers";

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

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

function ActionButton({ title, description, active, onClick, accent }) {
  const activeClass =
    accent === "emerald"
      ? "border-emerald-300/70 bg-emerald-100/55 text-emerald-900 shadow-emerald-300/30"
      : accent === "indigo"
      ? "border-indigo-300/70 bg-indigo-100/55 text-indigo-900 shadow-indigo-300/30"
      : "border-pink-300/70 bg-pink-100/55 text-pink-900 shadow-pink-300/30";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.75rem] border p-5 text-left shadow-lg ring-1 ring-white/30 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/35 ${
        active
          ? activeClass
          : "border-white/35 bg-white/20 text-slate-800 shadow-slate-300/20"
      }`}
    >
      <p className="text-lg font-black">{title}</p>
      <p className="mt-2 text-sm leading-6 opacity-80">{description}</p>
    </button>
  );
}

function DashboardPage() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("add");
  const [query, setQuery] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [imageSearchPreview, setImageSearchPreview] = useState("");

  const [addProductFile, setAddProductFile] = useState(null);
  const [addProductPreview, setAddProductPreview] = useState("");
  const [saveResult, setSaveResult] = useState(null);

  const [results, setResults] = useState([]);
  const [vlmAnalysis, setVlmAnalysis] = useState(null);

  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const [searchLoading, setSearchLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    description: "",
  });

  const [currentSlide, setCurrentSlide] = useState(0);

  const activeSlide = HERO_SLIDES[currentSlide];

  let user = null;

  try {
    const storedUser = localStorage.getItem("user");
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const clearAuthAndGoToLogin = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    localStorage.removeItem("demo_user_logged_in");
    localStorage.removeItem("demo_user_name");
    localStorage.removeItem("demo_user_email");

    navigate("/login");
  };

  const handleLogout = () => {
    clearAuthAndGoToLogin();
  };

  const getBackendErrorMessage = async (response, fallbackMessage) => {
    try {
      const data = await response.json();

      if (typeof data.detail === "string") {
        return data.detail;
      }

      if (Array.isArray(data.detail)) {
        return data.detail
          .map((item) => item.msg || "Invalid request.")
          .join(" ");
      }

      return fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentSlide((previousSlide) =>
        previousSlide === HERO_SLIDES.length - 1 ? 0 : previousSlide + 1
      );
    }, 4500);

    return () => clearInterval(intervalId);
  }, []);

  const handleRefreshCatalog = async () => {
    const token = getToken();

    if (!token) {
      clearAuthAndGoToLogin();
      return;
    }

    setCatalogLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/products/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        clearAuthAndGoToLogin();
        return;
      }

      if (!response.ok) {
        const message = await getBackendErrorMessage(
          response,
          "Catalog refresh failed. Please check the backend connection."
        );

        setError(message);
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setCatalogProducts(data);
      } else {
        setCatalogProducts(getResultsArray(data));
      }
    } catch (error) {
      console.error("Catalog refresh failed:", error);

      setError(
        "Catalog refresh failed. Make sure the backend is running and reachable."
      );
    } finally {
      setCatalogLoading(false);
    }
  };

  const openAddSection = () => {
    setActiveSection("add");
    setError("");
    setMessage("");
  };

  const openCatalogSection = async () => {
    setActiveSection("catalog");
    setError("");
    setMessage("");
    await handleRefreshCatalog();
  };

  const openSearchSection = () => {
    setActiveSection("search");
    setError("");
    setMessage("");
  };

  const getSaveAnalysis = () => {
    return saveResult?.vlm_analysis || saveResult?.analysis || null;
  };

  const handleAddProductImageChange = (event) => {
    const file = event.target.files?.[0];

    setError("");
    setMessage("");
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
    setMessage("");

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
    const token = getToken();

    if (!token) {
      clearAuthAndGoToLogin();
      return;
    }

    if (!addProductFile) {
      setError("Please select a product image first.");
      return;
    }

    setActiveSection("add");
    setSaveLoading(true);
    setError("");
    setMessage("");
    setSaveResult(null);

    try {
      const formData = new FormData();
      formData.append("file", addProductFile);

      const response = await fetch(`${API_BASE_URL}/products/analyze-and-save`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401 || response.status === 403) {
        clearAuthAndGoToLogin();
        return;
      }

      if (!response.ok) {
        const message = await getBackendErrorMessage(
          response,
          "Analyze and save failed. Please upload a supported product image."
        );

        setError(message);
        return;
      }

      const data = await response.json();

      setSaveResult(data);
      setMessage("Product has been analyzed and saved successfully.");
      await handleRefreshCatalog();
    } catch (error) {
      console.error("Analyze and save failed:", error);

      setError(
        "Analyze and save failed. Make sure the backend and AI service are running."
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const handleTextSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a search query.");
      return;
    }

    setActiveSection("search");
    setSearchLoading(true);
    setError("");
    setMessage("");
    setVlmAnalysis(null);
    setResults([]);

    try {
      const data = await searchByText(query);

      setResults(filterStrongResults(data));
    } catch (error) {
      console.error("Text search failed:", error);

      const backendMessage =
        error.response?.data?.detail ||
        "Text search failed. Please check the backend connection.";

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

    setActiveSection("search");
    setSearchLoading(true);
    setError("");
    setMessage("");
    setVlmAnalysis(null);
    setResults([]);

    try {
      const data = await searchByImage(selectedFile);

      setVlmAnalysis(data?.vlm_analysis || data?.analysis || null);
      setResults(filterStrongResults(data));
    } catch (error) {
      console.error("Image search failed:", error);

      const backendMessage =
        error.response?.data?.detail ||
        "Image search failed. Please check the backend and AI service.";

      setError(backendMessage);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleEditClick = (product) => {
    setActiveSection("catalog");
    setEditingProduct(product);

    setEditForm({
      name: product?.name || "",
      category: product?.category || "",
      description: product?.description || "",
    });

    setMessage("");
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);

    setEditForm({
      name: "",
      category: "",
      description: "",
    });

    setError("");
  };

  const handleUpdateProduct = async (event) => {
    event.preventDefault();

    if (!editingProduct) {
      return;
    }

    if (!editForm.name.trim()) {
      setError("Product name is required.");
      return;
    }

    setError("");
    setMessage("");

    try {
      await updateProduct(editingProduct.id, {
        name: editForm.name.trim(),
        category: editForm.category.trim() || null,
        description: editForm.description.trim() || null,
      });

      setMessage("Product updated successfully.");
      setEditingProduct(null);

      setEditForm({
        name: "",
        category: "",
        description: "",
      });

      await handleRefreshCatalog();
    } catch (error) {
      console.error("Product update failed:", error);

      const backendMessage =
        error.response?.data?.detail ||
        "Failed to update product. Please try again.";

      setError(backendMessage);
    }
  };

  const handleDeleteProduct = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product?.name || "this product"}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await deleteProduct(product.id);

      setMessage("Product deleted successfully.");

      if (editingProduct?.id === product.id) {
        setEditingProduct(null);
      }

      await handleRefreshCatalog();
    } catch (error) {
      console.error("Product delete failed:", error);

      const backendMessage =
        error.response?.data?.detail ||
        "Failed to delete product. Please try again.";

      setError(backendMessage);
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
        <div className="mb-6 flex flex-col justify-between gap-3 rounded-[2rem] border border-white/35 bg-white/20 p-4 shadow-sm ring-1 ring-white/30 backdrop-blur-3xl md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
              Logged In Workspace
            </p>

            <p className="mt-1 text-sm font-bold text-slate-800">
              {user?.name ? `Welcome, ${user.name}` : "Authenticated user"}
              {user?.email ? ` · ${user.email}` : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-2xl border border-rose-200/70 bg-rose-100/60 px-5 py-3 text-sm font-black text-rose-800 shadow-sm ring-1 ring-white/30 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-rose-200/70"
          >
            Logout
          </button>
        </div>

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

        <GlassCard className="mb-8">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
              Workspace
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Choose an action
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              Open only the workflow you need. This keeps the dashboard clean
              and focused.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ActionButton
              title="Add Product"
              description="Upload a product image, analyze it, and save it to the catalog."
              active={activeSection === "add"}
              accent="emerald"
              onClick={openAddSection}
            />

            <ActionButton
              title="View Catalog"
              description="Review saved products already available in your catalog."
              active={activeSection === "catalog"}
              accent="indigo"
              onClick={openCatalogSection}
            />

            <ActionButton
              title="Search Products"
              description="Search the catalog using text or a reference image."
              active={activeSection === "search"}
              accent="pink"
              onClick={openSearchSection}
            />
          </div>
        </GlassCard>

        {message && (
          <div className="mb-8 rounded-3xl border border-emerald-200/70 bg-emerald-100/45 p-4 text-sm font-bold text-emerald-800 shadow-sm ring-1 ring-white/30 backdrop-blur-2xl">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-8 rounded-3xl border border-rose-200/70 bg-rose-100/45 p-4 text-sm font-bold text-rose-800 shadow-sm ring-1 ring-white/30 backdrop-blur-2xl">
            {error}
          </div>
        )}

        {activeSection === "add" && (
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
                  {saveLoading ? "Analyzing Product..." : "Analyze & Save"}
                </button>
              </div>

              <div>
                {saveLoading && (
                  <div className="rounded-3xl border border-amber-200/70 bg-amber-100/45 p-5 text-sm font-bold text-amber-800 ring-1 ring-white/30 backdrop-blur-2xl">
                    Analyzing the image and creating a searchable catalog entry...
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
        )}

        {activeSection === "catalog" && (
          <>
            {editingProduct && (
              <GlassCard className="mb-8">
                <div className="mb-5">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-indigo-500">
                    Product Management
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-slate-950">
                    Edit Product
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    Update the product name, category, or description. Changes
                    are saved to your authenticated catalog.
                  </p>
                </div>

                <form onSubmit={handleUpdateProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-black text-slate-700">
                      Product Name
                    </label>

                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          name: event.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-2xl border border-white/40 bg-white/35 px-4 py-3 text-sm font-semibold text-slate-900 outline-none ring-1 ring-white/30 backdrop-blur-2xl placeholder:text-slate-500 focus:border-indigo-300/80 focus:bg-white/45 focus:ring-4 focus:ring-indigo-200/45"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-slate-700">
                      Category
                    </label>

                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          category: event.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-2xl border border-white/40 bg-white/35 px-4 py-3 text-sm font-semibold text-slate-900 outline-none ring-1 ring-white/30 backdrop-blur-2xl placeholder:text-slate-500 focus:border-indigo-300/80 focus:bg-white/45 focus:ring-4 focus:ring-indigo-200/45"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-slate-700">
                      Description
                    </label>

                    <textarea
                      value={editForm.description}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          description: event.target.value,
                        })
                      }
                      rows="5"
                      className="mt-2 w-full rounded-2xl border border-white/40 bg-white/35 px-4 py-3 text-sm font-semibold text-slate-900 outline-none ring-1 ring-white/30 backdrop-blur-2xl placeholder:text-slate-500 focus:border-indigo-300/80 focus:bg-white/45 focus:ring-4 focus:ring-indigo-200/45"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="submit"
                      className="rounded-2xl border border-indigo-300/50 bg-indigo-500/85 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-300/40 ring-1 ring-white/30 backdrop-blur-xl transition hover:bg-indigo-600/90"
                    >
                      Save Changes
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="rounded-2xl border border-slate-300/70 bg-white/55 px-6 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-white/40 backdrop-blur-xl transition hover:bg-white/80"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </GlassCard>
            )}

            <CatalogSection
              products={catalogProducts}
              catalogLoading={catalogLoading}
              onRefreshCatalog={handleRefreshCatalog}
              onEdit={handleEditClick}
              onDelete={handleDeleteProduct}
            />
          </>
        )}

        {activeSection === "search" && (
          <>
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
                  placeholder="Example: brown shirt"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="mt-5 w-full rounded-2xl border border-pink-200/60 bg-white/25 px-4 py-3 text-slate-900 outline-none shadow-sm ring-1 ring-white/30 backdrop-blur-2xl transition placeholder:text-slate-500 focus:border-pink-300/80 focus:bg-white/35 focus:ring-4 focus:ring-pink-200/45"
                />

                <button
                  onClick={handleTextSearch}
                  disabled={searchLoading}
                  className="mt-4 w-full rounded-2xl border border-slate-700/30 bg-slate-950/90 px-6 py-3 font-black text-white shadow-lg shadow-slate-400/25 ring-1 ring-white/20 backdrop-blur-xl transition hover:bg-slate-800 disabled:bg-slate-400/60"
                >
                  {searchLoading ? "Searching Catalog..." : "Search Catalog"}
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
                  {searchLoading
                    ? "Finding Matches..."
                    : "Find Similar Products"}
                </button>
              </GlassCard>
            </div>

            {searchLoading && (
              <div className="mb-8 rounded-3xl border border-amber-200/70 bg-amber-100/45 p-4 text-sm font-bold text-amber-800 ring-1 ring-white/30 backdrop-blur-2xl">
                Searching your catalog for the most relevant products...
              </div>
            )}

            <ProductAnalysisCard
              title="Image Search Analysis"
              analysis={vlmAnalysis}
            />

            <GlassCard>
              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-500">
                  Discovery Output
                </p>

                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  Search Results
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                  Showing the most relevant products from your saved catalog.
                </p>
              </div>

              {results.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-white/35 bg-white/20 p-8 text-center ring-1 ring-white/25 backdrop-blur-2xl">
                  <p className="text-sm font-black uppercase tracking-[0.28em] text-slate-400">
                    No relevant products found
                  </p>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Try a more specific query such as “brown shirt,” “denim
                    shorts,” or add more products to your catalog.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  {results.map((product, index) => (
                    <ProductCard
                      key={product?.id || product?.point_id || index}
                      product={product}
                    />
                  ))}
                </div>
              )}
            </GlassCard>
          </>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;