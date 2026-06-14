export const MIN_SCORE = 0.5;

export function getResultsArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.matches)) {
    return data.matches;
  }

  if (Array.isArray(data?.products)) {
    return data.products;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.data?.results)) {
    return data.data.results;
  }

  if (Array.isArray(data?.data?.matches)) {
    return data.data.matches;
  }

  if (Array.isArray(data?.data?.products)) {
    return data.data.products;
  }

  return [];
}

export function getPayload(product) {
  return product?.payload || product || {};
}

export function getAnalysis(product) {
  const payload = getPayload(product);

  return (
    payload?.vlm_analysis ||
    payload?.analysis ||
    product?.vlm_analysis ||
    product?.analysis ||
    {}
  );
}

export function getProductName(product) {
  const payload = getPayload(product);
  const analysis = getAnalysis(product);

  return (
    product?.name ||
    payload?.name ||
    payload?.product_name ||
    payload?.title ||
    analysis?.product_name ||
    analysis?.product_type ||
    analysis?.style ||
    "Unnamed Product"
  );
}

export function getProductCategory(product) {
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

export function getProductDescription(product) {
  const payload = getPayload(product);
  const analysis = getAnalysis(product);

  return (
    product?.description ||
    payload?.description ||
    payload?.short_description ||
    analysis?.short_description ||
    payload?.search_text ||
    product?.search_text ||
    "No description available."
  );
}

export function getProductScore(product) {
  const score = product?.score ?? product?.similarity ?? product?.distance;

  if (score === undefined || score === null) {
    return "N/A";
  }

  return Number(score).toFixed(3);
}

export function getColors(analysis) {
  if (Array.isArray(analysis?.colors)) {
    return analysis.colors.join(", ");
  }

  if (typeof analysis?.colors === "string") {
    return analysis.colors;
  }

  return "N/A";
}

export function getSearchTags(analysis) {
  if (Array.isArray(analysis?.search_tags)) {
    return analysis.search_tags.join(", ");
  }

  if (typeof analysis?.search_tags === "string") {
    return analysis.search_tags;
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
    : analysis?.colors || "";
  const description =
    analysis?.short_description ||
    payload?.short_description ||
    payload?.description ||
    "";

  return normalizeText(
    `${name} ${category} ${productType} ${style} ${colors} ${description}`
  );
}

function removeDuplicateProducts(products) {
  const seen = new Set();

  return products.filter((product) => {
    const key = getDuplicateKey(product);

    if (!key) {
      return true;
    }

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function filterStrongResults(data) {
  const results = getResultsArray(data);

  const strongResults = results.filter((product) => {
    const score = product?.score ?? product?.similarity;

    if (score === undefined || score === null) {
      return true;
    }

    return Number(score) >= MIN_SCORE;
  });

  return removeDuplicateProducts(strongResults);
}