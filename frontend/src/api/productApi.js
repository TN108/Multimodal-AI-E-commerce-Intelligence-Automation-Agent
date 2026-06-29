import apiClient from "./axiosClient";

export async function getProducts() {
  const response = await apiClient.get("/api/v1/products/");
  return response.data;
}

export async function createProduct(productData) {
  const response = await apiClient.post("/api/v1/products/", productData);
  return response.data;
}

export async function getProductById(productId) {
  const response = await apiClient.get(`/api/v1/products/${productId}`);
  return response.data;
}

export async function updateProduct(productId, productData) {
  const response = await apiClient.put(
    `/api/v1/products/${productId}`,
    productData
  );

  return response.data;
}

export async function deleteProduct(productId) {
  const response = await apiClient.delete(`/api/v1/products/${productId}`);
  return response.data;
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