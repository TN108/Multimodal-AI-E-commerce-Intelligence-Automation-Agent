import { useState } from "react";
import {
  searchByText,
  searchByImage,
  analyzeAndSaveProduct,
} from "./api/multimodalApi";

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

  const MIN_SCORE = 0.5;

  const getResultsArray = (data) => {
    return data?.results || data?.matches || data?.products || [];
  };

  const filterStrongResults = (data) => {
    return getResultsArray(data).filter((product) => {
      const score = product?.score ?? product?.similarity ?? 0;
      return score >= MIN_SCORE;
    });
  };

  const getPayload = (product) => {
    return product?.payload || product || {};
  };

  const getAnalysis = (product) => {
    const payload = getPayload(product);
    return payload?.vlm_analysis || product?.vlm_analysis || {};
  };

  const getProductName = (product) => {
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
  };

  const getProductCategory = (product) => {
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
  };

  const getProductDescription = (product) => {
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
  };

  const getProductScore = (product) => {
    if (product?.score !== undefined) return Number(product.score).toFixed(3);
    if (product?.similarity !== undefined) {
      return Number(product.similarity).toFixed(3);
    }

    return "N/A";
  };

  const getColors = (analysis) => {
    if (Array.isArray(analysis?.colors)) {
      return analysis.colors.join(", ");
    }

    return "N/A";
  };

  const handleAddProductImageChange = (event) => {
    const file = event.target.files[0];

    setError("");
    setSaveResult(null);

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid product image.");
      return;
    }

    setAddProductFile(file);
    setAddProductPreview(URL.createObjectURL(file));
  };

  const handleImageSearchFileChange = (event) => {
    const file = event.target.files[0];

    setError("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
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
        "Analyze and save failed. Check backend, Qdrant, Ollama/VLM, and CORS.";

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
        "Text search failed. Check backend, Qdrant, and CORS.";

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
        "Image search failed. Check backend, Qdrant, Ollama/VLM, and CORS.";

      setError(backendMessage);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Multimodal Product Search
          </h1>

          <p className="text-gray-600 mt-3">
            Add products to Qdrant, then search them using text or product
            images.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-8">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Add Product to Database
          </h2>

          <p className="text-gray-600 mb-4">
            Upload a product image. The backend will analyze it using VLM and
            save the product embedding plus metadata into Qdrant.
          </p>

          <input
            type="file"
            accept="image/*"
            onChange={handleAddProductImageChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4"
          />

          {addProductPreview && (
            <div className="mb-4">
              <p className="font-semibold text-gray-800 mb-2">Image Preview</p>

              <img
                src={addProductPreview}
                alt="Product preview"
                className="w-64 h-64 object-contain border border-gray-300 rounded-xl bg-gray-50"
              />
            </div>
          )}

          <button
            onClick={handleAnalyzeAndSaveProduct}
            disabled={saveLoading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-green-300"
          >
            {saveLoading ? "Analyzing & Saving..." : "Analyze & Save Product"}
          </button>

          {saveResult && (
            <div className="mt-6 space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4">
                Product analyzed and saved successfully.
              </div>

              {(saveResult.vlm_analysis || saveResult.analysis) && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Saved Product VLM Analysis
                  </h3>

                  {(() => {
                    const analysis =
                      saveResult.vlm_analysis || saveResult.analysis;

                    return (
                      <div className="space-y-2 text-gray-800">
                        <p>
                          <strong>Product Type:</strong>{" "}
                          {analysis?.product_type || "N/A"}
                        </p>

                        <p>
                          <strong>Category:</strong>{" "}
                          {analysis?.category || "N/A"}
                        </p>

                        <p>
                          <strong>Gender:</strong>{" "}
                          {analysis?.gender || "N/A"}
                        </p>

                        <p>
                          <strong>Style:</strong> {analysis?.style || "N/A"}
                        </p>

                        <p>
                          <strong>Material:</strong>{" "}
                          {analysis?.material_guess || "N/A"}
                        </p>

                        <p>
                          <strong>Colors:</strong> {getColors(analysis)}
                        </p>

                        <p>
                          <strong>Search Tags:</strong>{" "}
                          {Array.isArray(analysis?.search_tags)
                            ? analysis.search_tags.join(", ")
                            : "N/A"}
                        </p>

                        <p>
                          <strong>Description:</strong>{" "}
                          {analysis?.short_description || "N/A"}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {saveResult.search_text && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Search Text Saved in Qdrant
                  </h3>

                  <p className="text-gray-700">{saveResult.search_text}</p>
                </div>
              )}

              <details>
                <summary className="cursor-pointer text-blue-600 font-semibold">
                  View raw save response
                </summary>

                <pre className="bg-gray-900 text-green-300 rounded-xl p-4 text-sm overflow-x-auto mt-3">
                  {JSON.stringify(saveResult, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Text Search
            </h2>

            <input
              type="text"
              placeholder="Example: brown leather handbag"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-black"
            />

            <button
              onClick={handleTextSearch}
              disabled={searchLoading}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400"
            >
              {searchLoading ? "Searching..." : "Search by Text"}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Image Search
            </h2>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageSearchFileChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4"
            />

            {imageSearchPreview && (
              <div className="mb-4">
                <p className="font-semibold text-gray-800 mb-2">
                  Search Image Preview
                </p>

                <img
                  src={imageSearchPreview}
                  alt="Search preview"
                  className="w-48 h-48 object-contain border border-gray-300 rounded-xl bg-gray-50"
                />
              </div>
            )}

            <button
              onClick={handleImageSearch}
              disabled={searchLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300"
            >
              {searchLoading ? "Processing..." : "Search by Image"}
            </button>
          </div>
        </div>

        {searchLoading && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 mb-8">
            Processing search request...
          </div>
        )}

        {vlmAnalysis && (
          <div className="bg-white rounded-2xl shadow p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Image Search VLM Analysis
            </h2>

            <pre className="bg-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
              {JSON.stringify(vlmAnalysis, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Search Results
          </h2>

          {results.length === 0 ? (
            <p className="text-gray-600">
              No strong results yet. Search by text or image after saving
              products into Qdrant.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {results.map((product, index) => {
                const analysis = getAnalysis(product);

                return (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl p-4 bg-white"
                  >
                    <h3 className="font-bold text-gray-900">
                      {getProductName(product)}
                    </h3>

                    <p className="text-sm text-gray-600 mt-1">
                      {getProductCategory(product)}
                    </p>

                    <p className="text-sm text-gray-800 mt-3">
                      {getProductDescription(product)}
                    </p>

                    {analysis?.colors && (
                      <p className="text-sm text-gray-700 mt-3">
                        <strong>Colors:</strong> {getColors(analysis)}
                      </p>
                    )}

                    {analysis?.style && (
                      <p className="text-sm text-gray-700 mt-1">
                        <strong>Style:</strong> {analysis.style}
                      </p>
                    )}

                    <p className="text-sm font-semibold text-green-700 mt-3">
                      Score: {getProductScore(product)}
                    </p>

                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-blue-600">
                        View raw result
                      </summary>

                      <pre className="bg-gray-100 rounded-lg p-3 text-xs overflow-x-auto mt-2">
                        {JSON.stringify(product, null, 2)}
                      </pre>
                    </details>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;