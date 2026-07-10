import React, { useState, useEffect } from "react";
import "./App.css";
import allProducts from "./aero-master-products.json";

const API_URL = "http://localhost:3001";

const ProductCard = ({ product }) => (
  <div className="product-card">
    {product.promotion_flag && (
      <span className="promotion-badge">Trending</span>
    )}
    <img
      className="product-image"
      src={`${API_URL}/api/image?url=${encodeURIComponent(product.image_url)}`}
      alt={product.name}
    />
    <h3>{product.name}</h3>
    <p className="category">{product.category}</p>
    <p className="price">${parseFloat(product.price).toFixed(2)}</p>
  </div>
);

const OutfitCard = ({ outfit, onEdit }) => (
  <div className="outfit-card">
    <h3>Complete Outfit</h3>
    {outfit.blurb && <p className="outfit-blurb">{outfit.blurb}</p>}
    <ul className="outfit-items">
      {outfit.items.map((item) => (
        <li
          style={{
            display: "inline-flex",
            flexDirection: "column",
            gap: "5px",
          }}
          key={item.name}
        >
          <img
            className="product-image"
            src={`${API_URL}/api/image?url=${encodeURIComponent(item.image_url)}`}
            alt={item.name}
          />
          <span>{item.name}</span>
          <span>${parseFloat(item.price).toFixed(2)}</span>
        </li>
      ))}
    </ul>

    <div className="outfit-card-footer">
      <button className="edit-button" onClick={onEdit}>
        Edit Selection
      </button>
      <button className="cart-button">Add to Cart</button>
      <div className="prices">
        <span className="original-price">
          ${parseFloat(outfit.original_price).toFixed(2)}
        </span>
        <span className="discounted-price">
          ${outfit.discounted_price.toFixed(2)}
        </span>
      </div>
    </div>
  </div>
);

const EditOutfitModal = ({ outfit, onClose }) => {
  const [currentOutfit, setCurrentOutfit] = useState(outfit);
  const [selectedItem, setSelectedItem] = useState(null);
  const [catalogItems, setCatalogItems] = useState([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);

  const getCategoryType = (category) => {
    if (typeof category !== "string") return null;
    const lowerCaseCategory = category.toLowerCase();
    if (lowerCaseCategory.includes("tops")) return "tops";
    if (
      lowerCaseCategory.includes("bottoms") ||
      lowerCaseCategory.includes("jeans")
    )
      return "bottoms";
    if (lowerCaseCategory.includes("shoes")) return "shoes";
    if (lowerCaseCategory.includes("accessories")) return "accessories";
    if (lowerCaseCategory.includes("bras-undies")) return "bras-undies";
    return "other";
  };

  useEffect(() => {
    setCurrentOutfit(outfit);
    if (outfit) {
      setSelectedItem(outfit.items[0]);
      setSelectedItemIndex(0);
    }
  }, [outfit]);

  useEffect(() => {
    if (selectedItem) {
      const selectedCategoryType = getCategoryType(selectedItem.category);
      const filteredCatalog = allProducts.filter(
        (p) => getCategoryType(p.category) === selectedCategoryType,
      );
      setCatalogItems(filteredCatalog);
    }
  }, [selectedItem]);

  const handleSelectItem = (item, index) => {
    setSelectedItem(item);
    setSelectedItemIndex(index);
  };

  const handleReplaceItem = (newItem) => {
    const newItems = [...currentOutfit.items];
    newItems[selectedItemIndex] = newItem;
    const newOutfit = { ...currentOutfit, items: newItems };
    setCurrentOutfit(newOutfit);
    setSelectedItem(newItem);
  };

  if (!currentOutfit) return null;

  const totalPrice = currentOutfit.items
    .reduce((acc, item) => acc + parseFloat(item.price), 0)
    .toFixed(2);

  return (
    <div className="modal-overlay">
      <div className="modal-content-edit">
        <div className="modal-column">
          <h2>Items</h2>
          <ul className="outfit-items-edit">
            {currentOutfit.items.map((item, index) => (
              <li
                key={index}
                onClick={() => handleSelectItem(item, index)}
                className={selectedItemIndex === index ? "selected" : ""}
              >
                <img
                  className="product-image-small"
                  src={`${API_URL}/api/image?url=${encodeURIComponent(
                    item.image_url,
                  )}`}
                  alt={item.name}
                />
                <span>{item.name}</span>
                <span>${parseFloat(item.price).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="outfit-total">Total: ${totalPrice}</div>
        </div>
        <div className="modal-column">
          <h2>Selected Item</h2>
          {selectedItem && (
            <div className="selected-item-details">
              <img
                className="product-image-large"
                src={`${API_URL}/api/image?url=${encodeURIComponent(
                  selectedItem.image_url,
                )}`}
                alt={selectedItem.name}
              />
              <h3>{selectedItem.name}</h3>
              <p>{selectedItem.category}</p>
              <p>${parseFloat(selectedItem.price).toFixed(2)}</p>
            </div>
          )}
        </div>
        <div className="modal-column">
          <h2>Catalog</h2>
          <div className="catalog-grid">
            {catalogItems.map((item, index) => (
              <div key={index} className="catalog-item">
                <img
                  className="product-image"
                  src={`${API_URL}/api/image?url=${encodeURIComponent(
                    item.image_url,
                  )}`}
                  alt={item.name}
                />
                <span>{item.name}</span>
                <span>${parseFloat(item.price).toFixed(2)}</span>
                <button onClick={() => handleReplaceItem(item)}>Replace</button>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onClose} className="close-button-edit">
          Close
        </button>
      </div>
    </div>
  );
};

function App() {
  const [query, setQuery] = useState("");
  const [recommendations, setRecommendations] = useState({
    outfits: [],
    individual_products: [],
  });
  const [editingOutfit, setEditingOutfit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [genderFilter, setGenderFilter] = useState("all"); // 'all', 'guys', 'girls'
  const [error, setError] = useState(null);

  const runSearch = async () => {
    if (!query) return;

    setLoading(true);
    setHasSearched(true);
    setError(null);
    try {
      console.log("Fetching:", `${API_URL}/api/recommendations?q=${query}`);
      const response = await fetch(
        `${API_URL}/api/recommendations?q=${encodeURIComponent(query)}`,
      );
      console.log("Status:", response.status);

      if (!response.ok) {
        // Handle non-successful responses (e.g., 503 from the server)
        const errData = await response.json();
        console.error("API Error:", errData.message);
        setError(
          errData.message ||
            "Something went wrong fetching recommendations. Please try again.",
        );
        setRecommendations({ outfits: [], individual_products: [] }); // Clear previous results
        return; // Exit the function
      }

      const data = await response.json();
      console.log(data);
      setRecommendations({
        outfits: data.outfits || [],
        individual_products: data.individual_products || [],
      });
    } catch (err) {
      console.error("Fetch failed:", err);
      setError(
        "Couldn't reach the recommendation service. Is the server running?",
      );
      setRecommendations({ outfits: [], individual_products: [] }); // Clear results on error
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key !== "Enter") return;
    runSearch();
  };

  const outfitIsGender = (outfit, gender) => {
    const categories = outfit.items.map((item) =>
      (item.category || "").toLowerCase(),
    );

    if (gender === "girls") {
      const hasGirlsItem = categories.some(
        (cat) => cat.includes("girls") || cat.includes("dress"),
      );
      const hasGuysItem = categories.some((cat) => cat.includes("guys"));
      return hasGirlsItem && !hasGuysItem;
    }

    if (gender === "guys") {
      const hasGuysItem = categories.some((cat) => cat.includes("guys"));
      const hasGirlsItem = categories.some(
        (cat) => cat.includes("girls") || cat.includes("dress"),
      );
      return hasGuysItem && !hasGirlsItem;
    }

    return false; // Should not happen
  };

  const productIsGender = (product, gender) => {
    const category = (product.category || "").toLowerCase();
    if (gender === "girls") {
      return category.includes("girls") || category.includes("dress");
    }
    return category.includes(gender);
  };

  const filteredOutfits = recommendations.outfits.filter((outfit) => {
    if (genderFilter === "all") return true;
    return outfitIsGender(outfit, genderFilter);
  });

  const filteredIndividualProducts = recommendations.individual_products.filter(
    (product) => {
      if (genderFilter === "all") return true;
      return productIsGender(product, genderFilter);
    },
  );

  return (
    <div>
      <div className="header">
        <img
          src="Aeropostale-logo.png"
          alt="Aeropostale Logo"
          className="logo"
        />
        Aero-Intelligence Style Search Demo
      </div>
      <div className="App">
        <div className="search-bar">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            placeholder="Search for a style (e.g., 'beach wear')"
          />
          <button
            className="search-button"
            onClick={runSearch}
            disabled={!query || loading}
          >
            Search
          </button>
          <div className="filter-buttons">
            <button
              onClick={() => setGenderFilter("all")}
              className={genderFilter === "all" ? "active" : ""}
            >
              All
            </button>
            <button
              onClick={() => setGenderFilter("guys")}
              className={genderFilter === "guys" ? "active" : ""}
            >
              Guys
            </button>
            <button
              onClick={() => setGenderFilter("girls")}
              className={genderFilter === "girls" ? "active" : ""}
            >
              Girls
            </button>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="results">
            {error && <p className="error-message">{error}</p>}

            {!error &&
              hasSearched &&
              filteredOutfits.length === 0 &&
              filteredIndividualProducts.length === 0 && (
                <p>
                  No results found for "{query}". Please try another search.
                </p>
              )}

            {filteredOutfits.length > 0 && (
              <div>
                <h2>Suggested Outfits</h2>
                <div className="outfits-grid">
                  {filteredOutfits.map((outfit, index) => (
                    <OutfitCard
                      key={index}
                      outfit={outfit}
                      onEdit={() => setEditingOutfit(outfit)}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredIndividualProducts.length > 0 && (
              <div>
                <h2>Recommended Products</h2>
                <div className="products-grid">
                  {filteredIndividualProducts.map((product) => (
                    <ProductCard key={product.name} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <EditOutfitModal
          outfit={editingOutfit}
          onClose={() => setEditingOutfit(null)}
        />
      </div>
    </div>
  );
}

export default App;
