import axiosClient from "./axiosClient";

export const analyzeAndSaveProduct = async (imageFile) => {
  const formData = new FormData();
  formData.append("file", imageFile);

  const response = await axiosClient.post(
    "/api/v1/products/analyze-and-save",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};