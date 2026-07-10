const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") }); // Load environment variables from root
const products = require("./products.json");
const fetch = require("node-fetch");

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

app.get("/api/image", async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).send("No URL provided");
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).send(response.statusText);
    }
    response.body.pipe(res);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).send("Error fetching image");
  }
});

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
  const similarProducts =
    recommendations.getDiverseSimilarProducts(queryVector);

  const outfitsFromGemini = await recommendations.createOutfitsWithGemini(
    query,
    similarProducts,
  );

  const productMap = new Map(similarProducts.map((p) => [p.name, p]));

  const outfits = outfitsFromGemini
    .map((outfitData) => {
      let outfitItems;
      let blurb = ""; // default blurb

      if (Array.isArray(outfitData)) {
        // Handle old format: array of strings
        outfitItems = outfitData
          .map((name) => productMap.get(name))
          .filter(Boolean);
      } else if (outfitData && outfitData.items) {
        // Handle new format: object with items and blurb
        outfitItems = outfitData.items
          .map((name) => productMap.get(name))
          .filter(Boolean);
        blurb = outfitData.blurb || "";
      } else {
        // Unrecognized format, skip this outfit
        return null;
      }

      if (outfitItems.length < 2) return null;

      const currentOriginalPrice = outfitItems.reduce(
        (sum, item) => sum + item.price,
        0,
      );

      return {
        items: outfitItems,
        blurb: blurb,
        original_price: parseFloat(currentOriginalPrice.toFixed(2)),
        discounted_price: parseFloat((currentOriginalPrice * 0.85).toFixed(2)),
      };
    })
    .filter(Boolean);

  const outfitProductIds = new Set(
    outfits.flatMap((outfit) => outfit.items.map((item) => item.name)),
  );
  const individualProducts = similarProducts.filter(
    (p) => !outfitProductIds.has(p.name),
  );

  console.log("--- Outfits ---");
  //   console.dir(outfits, { depth: null });
  //   console.log("--- Individual Products ---");
  //   console.dir(individualProducts, { depth: null });

  res.json({ outfits, individual_products: individualProducts });
});
