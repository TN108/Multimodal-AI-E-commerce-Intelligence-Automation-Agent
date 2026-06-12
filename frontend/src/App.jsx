import { useState } from "react";
import { searchByText, searchByImage } from "./api/multimodalApi";

function App() {
  const [query, setQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [results, setResults] = useState([]);
  const [vlmAnalysis, setVlmAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const getResultsArray = (data) => {
    return data?.results || data?.matches || data?.products || [];
  };

  const getProductName = (product) => {
    return (
      product?.name ||
      product?.payload?.name ||
      product?.payload?.product_name ||
      product?.payload?.title ||
      "Unnamed Product"
    );
  };

  const getProductCategory = (product) => {
    return (
      product?.category ||
      product?.payload?.category ||
      product?.payload?.product_type ||
      "Unknown Category"
    );
  };

  const getProductDescription = (product) => {
    return (
      product?.description ||
      product?.payload?.description ||
      product?.payload?.short_description ||
      product?.payload?.search_text ||
      "No description available."
    );
  };

  const getProductScore = (product) => {
    if (product?.score !== undefined) return product.score;
    if (product?.similarity !== undefined) return product.similarity;
    return "N/A";
  };

  const handleTextSearch = async () => {
    if (!query.trim()) {
      alert("Please enter a search query.");
      return;
    }

    setLoading(true);
    setVlmAnalysis(null);
    setResults([]);

    try {
      const data = await searchByText(query);

      console.log("Text search response:", data);

      setResults(getResultsArray(data));
    } catch (error) {
      console.error("Text search failed:", error);
      alert("Text search failed. Check backend, Qdrant, and CORS.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSearch = async () => {
    if (!selectedFile) {
      alert("Please select an image first.");
      return;
    }

    setLoading(true);
    setVlmAnalysis(null);
    setResults([]);

    try {
      const data = await searchByImage(selectedFile);

      console.log("Image search response:", data);

      setVlmAnalysis(data?.vlm_analysis || data?.analysis || null);
      setResults(getResultsArray(data));
    } catch (error) {
      console.error("Image search failed:", error);
      alert("Image search failed. Check backend, Qdrant, Ollama/VLM, and CORS.");
    } finally {
      setLoading(false);
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
            Search products using text or upload a product image for VLM-based search.
          </p>
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
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400"
            >
              {loading ? "Searching..." : "Search by Text"}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Image Search
            </h2>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4"
            />

            <button
              onClick={handleImageSearch}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? "Processing..." : "Search by Image"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 mb-8">
            Processing request...
          </div>
        )}

        {vlmAnalysis && (
          <div className="bg-white rounded-2xl shadow p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              VLM Analysis
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
              No results yet. Search by text or image.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {results.map((product, index) => (
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;