const fs = require("fs").promises;
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = "gemini-embedding-2";

const embeddingModel = genAI.getGenerativeModel({ model });
const generativeModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    thinkingConfig: { thinkingBudget: 0 },
    responseMimeType: "application/json",
    responseSchema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          items: { type: "array", items: { type: "string" } },
          blurb: { type: "string" },
        },
        required: ["items", "blurb"],
      },
    },
    maxOutputTokens: 1024,
  },
});

const VECTORIZED_PRODUCTS_PATH = path.resolve(
  __dirname,
  "data/vectorized_products.json",
);

let vectorizedProducts = [];

async function loadVectorizedProducts() {
  try {
    const data = await fs.readFile(VECTORIZED_PRODUCTS_PATH, "utf-8");
    const products = JSON.parse(data);
    vectorizedProducts = products.map((p) => ({
      ...p,
      price: parseFloat(p.price) || 0,
    }));
    console.log("Vectorized products loaded and prices parsed.");
  } catch (error) {
    if (error.code === "ENOENT") {
      console.warn("WARNING: `vectorized_products.json` not found.");
      console.warn("Recommendations will be unavailable.");
      console.warn("Run `node vectorize_products.js` to generate the file.");
      // Keep vectorizedProducts as an empty array
    } else {
      console.error("Error loading vectorized products:", error);
      throw error; // Re-throw for other errors
    }
  }
}

function getVectorizedProducts() {
  return vectorizedProducts;
}

async function vectorizeQuery(query) {
  try {
    const result = await embeddingModel.embedContent({
      content: {
        role: "document",
        parts: [{ text: query }],
      },
    });
    return result.embedding.values;
  } catch (error) {
    console.error("Error vectorizing query:", error);
    throw error;
  }
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

function getTopNSimilarProducts(queryVector, n) {
  const scoredProducts = vectorizedProducts
    .map((product) => {
      const similarity = cosineSimilarity(queryVector, product.embedding);
      return { ...product, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity); // Sort by similarity in descending order

  return scoredProducts.slice(0, n);
}

const CATEGORY_FILTERS = [
  {
    name: "guysTops",
    filter: (p) => p.category?.toLowerCase() === "guystops",
  },
  {
    name: "guysBottoms",
    filter: (p) =>
      ["guysbottoms", "jeans-guys"].includes(p.category?.toLowerCase()),
  },
  {
    name: "guysAccessories",
    filter: (p) => p.category?.toLowerCase() === "guysaccessories",
  },
  {
    name: "girlsTops",
    filter: (p) => p.category?.toLowerCase() === "girlstops",
  },
  {
    name: "girlsBottoms",
    filter: (p) =>
      ["girlsbottoms", "jeans-girls"].includes(p.category?.toLowerCase()),
  },
  {
    name: "girlsAccessories",
    filter: (p) => p.category?.toLowerCase() === "girlsaccessories",
  },
  {
    name: "girlsDresses",
    filter: (p) => p.category?.toLowerCase() === "dresses",
  },
];

function getTopNForCategory(queryVector, filter, n) {
  const categoryProducts = vectorizedProducts.filter(filter);

  const scoredProducts = categoryProducts
    .map((product) => {
      if (!product.embedding) {
        return { ...product, similarity: -1 };
      }
      const similarity = cosineSimilarity(queryVector, product.embedding);
      return { ...product, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity);

  return scoredProducts.slice(0, n);
}

function getDiverseSimilarProducts(
  queryVector,
  numPerCategory = 10,
  poolSize = 50,
) {
  const includedProducts = new Set();
  let diverseProducts = [];

  console.log("--- Number of products per category found ---");
  for (const category of CATEGORY_FILTERS) {
    const products = getTopNForCategory(
      queryVector,
      category.filter,
      numPerCategory,
    );
    console.log(`${category.name}: ${products.length}`);
    products.forEach((p, i) => console.log(`${i + 1}. ${p.name}`));
    products.forEach((p) => {
      if (p.similarity > -1 && !includedProducts.has(p.name)) {
        diverseProducts.push(p);
        includedProducts.add(p.name);
      }
    });
  }

  // To ensure we still have a good number of products and catch any outliers
  const topOverall = getTopNSimilarProducts(queryVector, poolSize);
  topOverall.forEach((p) => {
    if (p.similarity > -1 && !includedProducts.has(p.name)) {
      diverseProducts.push(p);
      includedProducts.add(p.name);
    }
  });

  // Sort by similarity to have the most relevant ones first.
  diverseProducts.sort((a, b) => b.similarity - a.similarity);

  return diverseProducts;
}

async function createOutfitsWithGemini(query, products) {
  // `products` is already sorted by similarity, so taking the top N per
  // category (rather than a flat top-40 slice) guarantees every category
  // gets a shot instead of being crowded out by a stronger-matching one.
  const productsPerCategory = 10;
  const includedNames = new Set();
  const cappedProducts = [];
  for (const category of CATEGORY_FILTERS) {
    products
      .filter(category.filter)
      .slice(0, productsPerCategory)
      .forEach((p) => {
        if (!includedNames.has(p.name)) {
          cappedProducts.push(p);
          includedNames.add(p.name);
        }
      });
  }

  const promptProducts = cappedProducts.map((p) => ({
    name: p.name,
    category: p.category,
    design: p.design?.slice(0, 150),
  }));

  console.log(`--- Exact ${promptProducts.length} products sent to Gemini ---`);
  promptProducts.forEach((p, i) =>
    console.log(`${i + 1}. ${p.name} (${p.category})`),
  );

  const prompt = `
        You are an expert fashion stylist for Aeropostale.
        A user has searched for "${query}".
        I have a list of products that are similar to the user's search.
        Your task is to create 6 stylish and diverse outfits from this list of products.
        For each outfit, you must also write a short, one-sentence "blurb" that describes the outfit's style or vibe.

        Each outfit should consist of a top and a bottom, or a dress. It is highly recommended you add an accessory to any outfit but not necessary.
        There may be two tops in an outfit but only if they can be layered. For example: a white tee-shirt and a jean jacket.
        Accessories chosen must not be underwear or boxers. Always favor sunglasses or hairclips.
        NEVER put two bottoms in an outfit. For example: Jeans and denim shorts in one outfit.
        Items must all be for one gender.
        You must only use products from the provided list.
        You must return an array of 6 outfit objects.
        3 outfits for guys, 3 outfits for girls.

        Here is the list of available products:
        ${JSON.stringify(promptProducts, null, 2)}

        Return your 6 outfit recommendations as a JSON array. Each element must be an
        object with "items" (an array of product names for the outfit) and "blurb"
        (a short, one-sentence description of the outfit).
    `;

  let text = "";
  try {
    const result = await generativeModel.generateContent(prompt);
    const response = await result.response;
    text = response.text();
    const outfits = JSON.parse(text);
    return outfits; // This will be an array of outfit objects {items: [], blurb: ""}.
  } catch (error) {
    console.error("Error creating outfits with Gemini:", error);
    console.log("Gemini response text:", text);
    return []; // Return empty array on error
  }
}

module.exports = {
  loadVectorizedProducts,
  vectorizeQuery,
  getTopNSimilarProducts,
  getDiverseSimilarProducts,
  getVectorizedProducts,
  createOutfitsWithGemini,
};
