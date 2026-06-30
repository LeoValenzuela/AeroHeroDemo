const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") }); // Load environment variables from root
const products = require("./products.json");

const app = express();
app.use(cors());
const port = 3001;

const recommendations = require("./recommendations");

async function startServer() {
  try {
    await recommendations.loadVectorizedProducts();
    app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
      console.log("--- Server startup complete ---");
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    // The server will continue to run, but recommendations may be unavailable.
  }
}

startServer();

app.get("/api/recommendations", async (req, res) => {
  if (recommendations.getVectorizedProducts().length === 0) {
    return res.status(503).json({
      error: "Recommendation service unavailable.",
      message:
        "Product embeddings are not loaded. Please run the `vectorize_products.js` script on the server.",
    });
  }

  const query = req.query.q.toLowerCase();

  const queryVector = await recommendations.vectorizeQuery(query);
  const similarProducts = recommendations.getTopNSimilarProducts(
    queryVector,
    20,
  );
  const outfits = recommendations.assembleOutfits(similarProducts);
  const individualProducts = similarProducts.filter(
    (p) => !outfits.flat().some((op) => op.id === p.id),
  );

  console.log("--- Outfits ---");
  console.dir(outfits, { depth: null });
  console.log("--- Individual Products ---");
  console.dir(individualProducts, { depth: null });

  res.json({ outfits, individual_products: individualProducts });
});
