const fs = require("fs").promises;
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = "gemini-embedding-2";

const embeddingModel = genAI.getGenerativeModel({ model });

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

function assembleOutfits(products) {
  const outfits = [];
  const usedProductIds = new Set();

  const tops = products.filter((p) => p.category === "top");
  const bottoms = products.filter((p) => p.category === "bottom");
  const shoes = products.filter((p) => p.category === "shoes");
  const accessories = products.filter((p) => p.category === "accessory");

  // Try to create up to 3 outfits
  for (let i = 0; i < 3; i++) {
    const top = tops[i % tops.length];
    const bottom = bottoms[i % bottoms.length];
    const shoe = shoes[i % shoes.length];
    // Accessory is optional
    const accessory = accessories[i % accessories.length];

    if (top && bottom && shoe) {
      // An outfit must have at least a top, bottom, and shoes
      const outfit = {
        items: [top, bottom, shoe],
        original_price: top.price + bottom.price + shoe.price,
        discounted_price: (top.price + bottom.price + shoe.price) * 0.85, // Example 15% discount
      };

      if (accessory) {
        outfit.items.push(accessory);
        outfit.original_price += accessory.price;
        outfit.discounted_price = outfit.original_price * 0.8; // Example 20% discount with accessory
      }

      // Ensure products in an outfit are unique
      const outfitProductIds = new Set(outfit.items.map((item) => item.id));
      if (outfitProductIds.size === outfit.items.length) {
        outfits.push(outfit);
        outfit.items.forEach((item) => usedProductIds.add(item.id));
      }
    }
  }
  return outfits;
}

module.exports = {
  loadVectorizedProducts,
  vectorizeQuery,
  getTopNSimilarProducts,
  assembleOutfits,
  getVectorizedProducts,
};
