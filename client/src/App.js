import React, { useState, useEffect } from "react";
import "./App.css";
import allProducts from "./aero-master-products.json";

const API_URL = "http://localhost:3001";

const createEmptyOutfit = () => ({
  items: [],
  blurb: "",
  original_price: 0,
  discounted_price: 0,
});

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

const OutfitCard = ({ outfit, onEdit, onAddToCloset }) => (
  <div className="outfit-card">
    <h3>Outfit</h3>
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
      <button className="closet-button" onClick={onAddToCloset}>
        Add to Closet
      </button>
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

const CATEGORY_ORDER = ["tops", "bottoms", "accessories"];
const CATEGORY_LIMITS = { tops: 2, bottoms: 1, accessories: 1 };
const CATEGORY_LABELS = {
  tops: "Top",
  bottoms: "Bottom",
  accessories: "Accessory",
};
const CATALOG_PAGE_SIZE = 10;

const EditOutfitModal = ({ outfit, onClose, onAddToCloset }) => {
  const [currentOutfit, setCurrentOutfit] = useState(outfit);
  const [selectedItem, setSelectedItem] = useState(null);
  const [catalogItems, setCatalogItems] = useState([]);
  const [visibleCatalogCount, setVisibleCatalogCount] =
    useState(CATALOG_PAGE_SIZE);
  const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
  const [addingType, setAddingType] = useState(null);

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
    setAddingType(null);
    if (outfit && outfit.items && outfit.items.length > 0) {
      setSelectedItem(outfit.items[0]);
      setSelectedItemIndex(0);
    } else {
      setSelectedItem(null);
      setSelectedItemIndex(-1);
    }
  }, [outfit]);

  useEffect(() => {
    const activeCategoryType =
      addingType || (selectedItem && getCategoryType(selectedItem.category));
    if (activeCategoryType) {
      const filteredCatalog = allProducts.filter(
        (p) => getCategoryType(p.category) === activeCategoryType,
      );
      setCatalogItems(filteredCatalog);
    } else {
      setCatalogItems([]);
    }
    setVisibleCatalogCount(CATALOG_PAGE_SIZE);
  }, [selectedItem, addingType]);

  const handleCatalogScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight < 150) {
      setVisibleCatalogCount((prev) =>
        Math.min(prev + CATALOG_PAGE_SIZE, catalogItems.length),
      );
    }
  };

  if (!currentOutfit) return null;

  const handleSelectItem = (item, index) => {
    setAddingType(null);
    setSelectedItem(item);
    setSelectedItemIndex(index);
  };

  const handleStartAdd = (type) => {
    setSelectedItem(null);
    setSelectedItemIndex(-1);
    setAddingType(type);
  };

  const handleReplaceItem = (newItem) => {
    const newItems = [...currentOutfit.items];
    newItems[selectedItemIndex] = newItem;
    const newOutfit = { ...currentOutfit, items: newItems };
    setCurrentOutfit(newOutfit);
    setSelectedItem(newItem);
  };

  const handleAddItem = (newItem) => {
    const limit = CATEGORY_LIMITS[addingType];
    const currentCount = currentOutfit.items.filter(
      (item) => getCategoryType(item.category) === addingType,
    ).length;
    if (!limit || currentCount >= limit) return;

    const newItems = [...currentOutfit.items, newItem];
    setCurrentOutfit({ ...currentOutfit, items: newItems });
    setSelectedItem(newItem);
    setSelectedItemIndex(newItems.length - 1);
    setAddingType(null);
  };

  const originalPrice = currentOutfit.items.reduce(
    (acc, item) => acc + parseFloat(item.price),
    0,
  );
  const hasDiscount = currentOutfit.items.length >= 2;
  const discountedPrice = hasDiscount ? originalPrice * 0.85 : originalPrice;

  const handleAddToCloset = () => {
    onAddToCloset({
      ...currentOutfit,
      original_price: originalPrice,
      discounted_price: discountedPrice,
    });
  };

  const itemsWithIndex = currentOutfit.items.map((item, idx) => ({
    item,
    idx,
    type: getCategoryType(item.category),
  }));
  const otherItems = itemsWithIndex.filter(
    ({ type }) => !CATEGORY_ORDER.includes(type),
  );

  const renderItemRow = ({ item, idx }) => (
    <li
      key={idx}
      onClick={() => handleSelectItem(item, idx)}
      className={!addingType && selectedItemIndex === idx ? "selected" : ""}
    >
      <img
        className="product-image-small"
        src={`${API_URL}/api/image?url=${encodeURIComponent(item.image_url)}`}
        alt={item.name}
      />
      <span>{item.name}</span>
      <span>${parseFloat(item.price).toFixed(2)}</span>
    </li>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content-edit">
        <div className="modal-column">
          <h2>Items</h2>
          <ul className="outfit-items-edit">
            {CATEGORY_ORDER.map((type) => {
              const groupItems = itemsWithIndex.filter((x) => x.type === type);
              const limit = CATEGORY_LIMITS[type];
              return (
                <React.Fragment key={type}>
                  {groupItems.map(renderItemRow)}
                  {groupItems.length < limit && (
                    <li className="add-item-row">
                      <button
                        type="button"
                        className={`add-item-tile${
                          addingType === type ? " active" : ""
                        }`}
                        onClick={() => handleStartAdd(type)}
                      >
                        + Add {CATEGORY_LABELS[type]}
                      </button>
                    </li>
                  )}
                </React.Fragment>
              );
            })}
            {otherItems.map(renderItemRow)}
          </ul>
          <div className="outfit-total prices">
            {hasDiscount ? (
              <>
                <span className="original-price">
                  ${originalPrice.toFixed(2)}
                </span>
                <span className="discounted-price">
                  ${discountedPrice.toFixed(2)}
                </span>
              </>
            ) : (
              <span>Total: ${originalPrice.toFixed(2)}</span>
            )}
          </div>
          <button
            className="closet-button closet-button-edit"
            onClick={handleAddToCloset}
            disabled={currentOutfit.items.length === 0}
          >
            Add to Closet
          </button>
        </div>
        <div className="modal-column">
          <h2>
            {addingType
              ? `Add a ${CATEGORY_LABELS[addingType]}`
              : "Selected Item"}
          </h2>
          {selectedItem && !addingType && (
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
          {addingType && (
            <p className="modal-hint">
              Choose a {CATEGORY_LABELS[addingType].toLowerCase()} from the
              catalog to add it to your outfit.
            </p>
          )}
          {!selectedItem && !addingType && (
            <p className="modal-hint">
              Select an item to view its details, or add a top, bottom, or
              accessory to build your outfit.
            </p>
          )}
        </div>
        <div className="modal-column">
          <h2>Catalog</h2>
          <div className="catalog-grid" onScroll={handleCatalogScroll}>
            {catalogItems.slice(0, visibleCatalogCount).map((item, index) => (
              <div key={index} className="catalog-item">
                <img
                  className="product-image"
                  loading="lazy"
                  src={`${API_URL}/api/image?url=${encodeURIComponent(
                    item.image_url,
                  )}`}
                  alt={item.name}
                />
                <span>{item.name}</span>
                <span>${parseFloat(item.price).toFixed(2)}</span>
                <button
                  onClick={() =>
                    addingType ? handleAddItem(item) : handleReplaceItem(item)
                  }
                >
                  {addingType ? "Add" : "Replace"}
                </button>
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

const Closet = ({ outfits, onRemove, onEdit }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  return (
    <div className="closet">
      <h2 className="closet-title">Your Closet</h2>
      {outfits.length === 0 ? (
        <p className="closet-empty">
          Outfits you save from search results or the outfit builder will show
          up here.
        </p>
      ) : (
        <ul className="closet-list">
          {outfits.map((outfit, index) => (
            <li
              className="closet-item"
              key={index}
              onClick={() =>
                setExpandedIndex(expandedIndex === index ? null : index)
              }
            >
              <div className="closet-item-images">
                {outfit.items.slice(0, 4).map((item) => (
                  <img
                    key={item.name}
                    className="closet-item-image"
                    src={`${API_URL}/api/image?url=${encodeURIComponent(item.image_url)}`}
                    alt={item.name}
                  />
                ))}
              </div>
              {outfit.blurb && (
                <p className="closet-item-blurb">{outfit.blurb}</p>
              )}
              <span className="closet-item-price">
                ${parseFloat(outfit.discounted_price).toFixed(2)}
              </span>
              {expandedIndex === index && (
                <div className="closet-item-actions">
                  <button
                    className="remove-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(index);
                    }}
                  >
                    Remove
                  </button>
                  <button
                    className="edit-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(outfit);
                    }}
                  >
                    Edit Selection
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
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
  const [closetOutfits, setClosetOutfits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [genderFilter, setGenderFilter] = useState("all"); // 'all', 'guys', 'girls'
  const [error, setError] = useState(null);

  const addToCloset = (outfit) => {
    setClosetOutfits((prev) => [...prev, outfit]);
  };

  const removeFromCloset = (index) => {
    setClosetOutfits((prev) => prev.filter((_, i) => i !== index));
  };

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
        Aero-Intelligence Outfit Search Demo
      </div>
      <div className="format">
        <div className="left">
          <button
            className="create-button"
            onClick={() => setEditingOutfit(createEmptyOutfit())}
          >
            Build an Outfit!
          </button>
          <Closet
            outfits={closetOutfits}
            onRemove={removeFromCloset}
            onEdit={(outfit) => setEditingOutfit(outfit)}
          />
        </div>
        <div className="App">
          <div className="search-bar">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              placeholder="Search for an outfit! (e.g., 'Find me casual beach vacay outfits')"
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
                Men
              </button>
              <button
                onClick={() => setGenderFilter("girls")}
                className={genderFilter === "girls" ? "active" : ""}
              >
                Women
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
                        onAddToCloset={() => addToCloset(outfit)}
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
            onAddToCloset={addToCloset}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
