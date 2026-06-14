import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

const QUERY_EXPANSIONS = {
  shoe: "shoes sneakers footwear trainers running shoes athletic shoes sports shoes",
  shoes: "shoes sneakers footwear trainers running shoes athletic shoes sports shoes",
  sneaker: "sneakers shoes footwear trainers running shoes athletic shoes sports shoes",
  sneakers: "sneakers shoes footwear trainers running shoes athletic shoes sports shoes",
  trainer: "trainers sneakers shoes footwear running shoes athletic shoes",
  trainers: "trainers sneakers shoes footwear running shoes athletic shoes",
  footwear: "footwear shoes sneakers trainers running shoes athletic shoes",

  bag: "bag backpack handbag purse tote shoulder bag crossbody bag travel bag",
  bags: "bags backpack handbag purse tote shoulder bag crossbody bag travel bag",
  backpack: "backpack bag school bag travel bag casual bag rucksack",
  handbag: "handbag bag purse shoulder bag crossbody bag",
  purse: "purse handbag bag shoulder bag crossbody bag",
  tote: "tote bag handbag shopping bag shoulder bag",

  shirt: "shirt t-shirt tshirt tee top blouse clothing upper wear",
  shirts: "shirts t-shirts tshirts tees tops blouses clothing upper wear",
  tshirt: "t-shirt shirt tee top clothing upper wear",
  "t-shirt": "t-shirt shirt tee top clothing upper wear",
  tee: "tee t-shirt shirt top clothing upper wear",
  top: "top shirt blouse t-shirt clothing upper wear",
  blouse: "blouse shirt top women clothing upper wear",

  dress: "dress gown formal wear evening wear party wear cocktail dress",
  dresses: "dresses gowns formal wear evening wear party wear cocktail dresses",
  gown: "gown dress formal wear evening wear party wear",
  formal: "formal wear dress gown suit evening wear party wear",
  party: "party wear dress gown evening wear cocktail dress",
  evening: "evening wear formal dress gown party wear",

  jacket: "jacket coat outerwear blazer hoodie winter wear",
  coat: "coat jacket outerwear winter wear",
  hoodie: "hoodie jacket sweatshirt casual wear",
  blazer: "blazer jacket formal wear suit outerwear",

  pants: "pants trousers jeans bottoms clothing",
  trouser: "trousers pants bottoms clothing",
  trousers: "trousers pants bottoms clothing",
  jeans: "jeans denim pants trousers bottoms clothing",

  watch: "watch wristwatch smartwatch accessory timepiece",
  watches: "watches wristwatches smartwatches accessories timepieces",

  sunglasses: "sunglasses glasses eyewear shades accessory",
  glasses: "glasses sunglasses eyewear shades accessory",
};

function expandSearchQuery(query) {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return query;
  }

  const words = normalizedQuery.split(/\s+/);

  const expandedTerms = words
    .map((word) => QUERY_EXPANSIONS[word])
    .filter(Boolean)
    .join(" ");

  if (!expandedTerms) {
    return query;
  }

  return `${query} ${expandedTerms}`;
}

export async function searchByText(query) {
  const expandedQuery = expandSearchQuery(query);

  const response = await apiClient.get("/api/v1/multimodal/search/text", {
    params: {
      query: expandedQuery,
    },
  });

  return response.data;
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

export async function getProducts() {
  const response = await apiClient.get("/api/v1/products/");
  return response.data;
}