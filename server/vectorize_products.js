const fs = require("fs").promises;
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { GoogleGenerativeAI } = require("@google/generative-ai");

// IMPORTANT: Make sure to set your Gemini API key as an environment variable
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Please set the GEMINI_API_KEY environment variable.");
  process.exit(1);
}

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(API_KEY);
const model = "gemini-embedding-2";

const embeddingModel = genAI.getGenerativeModel({ model });

// Path to the input and output files
const INPUT_FILE_PATH = path.resolve(
  __dirname,
  "../client/src/aero-master-products.json",
);
const OUTPUT_FILE_PATH = path.resolve(
  __dirname,
  "data/vectorized_products.json",
);

async function batchAndVectorizeProducts(products) {
  const BATCH_SIZE = 100;
  const vectorizedProducts = [];
  let count = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const requests = batch.map((product) => {
      const textToEmbed = `Product Name: ${product.name}
Category: ${product.category}
Type: ${product.type}
Attribute: ${product.attributes}
Design: ${product.design}
Season: ${product.season}
Color: ${product.color}
Price: ${product.price}`;
      return {
        content: {
          role: "document",
          parts: [{ text: textToEmbed }],
        },
      };
    });

    try {
      const result = await embeddingModel.batchEmbedContents({ requests });
      const embeddings = result.embeddings.map((embedding) => embedding.values);

      batch.forEach((product, index) => {
        vectorizedProducts.push({
          ...product,
          embedding: embeddings[index],
        });
      });

      count += batch.length;
      console.log(`Vectorized product ${count}/${products.length}`);
    } catch (error) {
      console.error("An error occurred during batch vectorization:", error);
      // Decide if you want to stop or continue
      // For now, we will stop
      throw error;
    }
  }
  return vectorizedProducts;
}

async function vectorizeProducts() {
  try {
    // Read the product data
    const productsData = await fs.readFile(INPUT_FILE_PATH, "utf-8");
    const products = JSON.parse(productsData);

    console.log(`Found ${products.length} products. Starting vectorization...`);

    const vectorizedProducts = await batchAndVectorizeProducts(products);

    // Ensure the output directory exists
    await fs.mkdir(path.dirname(OUTPUT_FILE_PATH), { recursive: true });

    // Save the vectorized data
    await fs.writeFile(
      OUTPUT_FILE_PATH,
      JSON.stringify(vectorizedProducts, null, 2),
    );

    console.log(`
Successfully vectorized ${vectorizedProducts.length} products.`);
    console.log(`Output saved to: ${OUTPUT_FILE_PATH}`);
  } catch (error) {
    console.error("An error occurred during vectorization:", error);
  }
}

vectorizeProducts();
