import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";
const MIN_SCORE = 0.5;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

const getResultsArray = (data) => {
  return data?.results || data?.matches || data?.products || [];
};

const filterStrongResults = (data) => {
  const results = getResultsArray(data);

  const filteredResults = results.filter((product) => {
    const score = product?.score ?? product?.similarity ?? 0;
    return score >= MIN_SCORE;
  });

  return {
    ...data,
    results: filteredResults,
  };
};

export async function searchByText(query) {
  const response = await apiClient.get("/api/v1/multimodal/search/text", {
    params: {
      query: query,
    },
  });

  return filterStrongResults(response.data);
}

export async function searchByImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post(
    "/api/v1/multimodal/search/image",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return filterStrongResults(response.data);
}

export async function analyzeAndSaveProduct(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post(
    "/api/v1/products/analyze-and-save",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}