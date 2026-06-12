import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

export async function searchByText(query) {
  const response = await axios.get(
    `${API_BASE_URL}/api/v1/multimodal/search/text`,
    {
      params: {
        query: query,
      },
    }
  );

  return response.data;
}

export async function searchByImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    `${API_BASE_URL}/api/v1/multimodal/search/image`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}