import React, { useState } from "react";
import "./App.css";

const API_URL = "http://localhost:3001";

const ProductCard = ({ product }) => (
  <div className="product-card">
    {product.promotion_flag && (
      <span className="promotion-badge">Trending</span>
    )}
    <img className="product-image" src="shirtplaceholder.jpg" alt="product" />
    {/* <img src={product.image_url} alt={product.name} /> */}
    <h3>{product.name}</h3>
    <p className="category">{product.category}</p>
    <p className="price">${product.price.toFixed(2)}</p>
  </div>
);

const OutfitCard = ({ outfit }) => (
  <div className="outfit-card">
    <h3>Complete Outfit</h3>
    <ul className="outfit-items">
      {outfit.items.map((item) => (
        <li
          style={{
            display: "inline-flex",
            flexDirection: "column",
            gap: "5px",
          }}
          key={item.id}
        >
          {/* <img
            className="product-image"
            src={product.image_url}
            alt={product.name}
          /> */}
          <img
            className="product-image"
            src="shirtplaceholder.jpg"
            alt="product"
          />
          <span>{item.name}</span>
          <span>${item.price.toFixed(2)}</span>
        </li>
      ))}
    </ul>
    <div className="prices">
      <span className="original-price">
        ${outfit.original_price.toFixed(2)}
      </span>
      <span className="discounted-price">
        ${outfit.discounted_price.toFixed(2)}
      </span>
    </div>
  </div>
);

function App() {
  const [query, setQuery] = useState("");
  const [recommendations, setRecommendations] = useState({
    outfits: [],
    individual_products: [],
  });

  const handleSearch = async (e) => {
    if (e.key === "Enter") {
      const response = await fetch(`${API_URL}/api/recommendations?q=${query}`);
      const data = await response.json();
      setRecommendations(data);
    }
  };

  return (
    <div className="App">
      <h1>Aero Outfit Search</h1>
      <div className="search-bar">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleSearch}
          placeholder="Search for a style (e.g., 'minimalist streetwear')"
        />
      </div>

      {recommendations && (
        <div className="results">
          {recommendations.outfits.length > 0 && (
            <div>
              <h2>Suggested Outfits</h2>
              <div className="outfits-grid">
                {recommendations.outfits.map((outfit, index) => (
                  <OutfitCard key={index} outfit={outfit} />
                ))}
              </div>
            </div>
          )}

          {recommendations.individual_products.length > 0 && (
            <div>
              <h2>Recommended Products</h2>
              <div className="products-grid">
                {recommendations.individual_products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
