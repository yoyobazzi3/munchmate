import { useState } from "react";
import { FaFilter, FaUtensils, FaStar, FaRulerHorizontal, FaSort, FaDollarSign } from "react-icons/fa";
import "./Filter.css";

const Filter = ({ onApply }) => {
  const [price, setPrice] = useState("");
  const [diningOption, setDiningOption] = useState("all");
  const [radius, setRadius] = useState(5000);
  const [category, setCategory] = useState(""); // Yelp-friendly category
  const [minRating, setMinRating] = useState("");
  const [sortBy, setSortBy] = useState("best_match");

  const yelpCategories = [
    { label: "All Cuisines", value: "" },
    { label: "Pizza", value: "pizza" },
    { label: "Mexican", value: "mexican" },
    { label: "Burgers", value: "burgers" },
    { label: "Sushi", value: "sushi" },
    { label: "Chinese", value: "chinese" },
    { label: "Indian", value: "indpak" },
    { label: "Italian", value: "italian" },
    { label: "Coffee & Tea", value: "coffee" },
    { label: "Bakery", value: "bakeries" },
  ];

  const handleApply = () => {
    onApply({
      price,
      diningOption,
      radius,
      category,
      minRating,
      sortBy,
    });
  };
  
  const handleReset = () => {
    setPrice("");
    setDiningOption("all");
    setRadius(5000);
    setCategory("");
    setMinRating("");
    setSortBy("best_match");
    
    onApply({
      price: "",
      diningOption: "all",
      radius: 5000,
      category: "",
      minRating: "",
      sortBy: "best_match",
    });
  };

  return (
    <div className="filter-container">
      <div className="filter-header">
        <h2><FaFilter className="filter-icon" /> Filters</h2>
        <p>Refine your restaurant search</p>
      </div>

      <div className="filter-section">
        <label className="filter-label">
          <FaUtensils className="label-icon" /> Category:
        </label>
        <select 
          className="filter-select"
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
        >
          {yelpCategories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <label className="filter-label">
          <FaDollarSign className="label-icon" /> Price Range:
        </label>
        <div className="price-buttons">
          {[1, 2, 3, 4].map((p) => (
            <button
              key={p}
              className={`price-button ${parseInt(price) === p ? 'active' : ''}`}
              onClick={() => setPrice(p.toString())}
            >
              {"$".repeat(p)}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">
          <FaStar className="label-icon" /> Minimum Rating:
        </label>
        <select 
          className="filter-select"
          value={minRating} 
          onChange={(e) => setMinRating(e.target.value)}
        >
          <option value="">Any Rating</option>
          <option value="4.5">4.5+ ⭐</option>
          <option value="4">4+ ⭐</option>
          <option value="3.5">3.5+ ⭐</option>
        </select>
      </div>

      <div className="filter-section">
        <label className="filter-label">Dining Options:</label>
        <div className="dining-options">
          {[
            { value: "all", label: "All" },
            { value: "dine-in", label: "Dine-in" },
            { value: "takeout", label: "Takeout" },
            { value: "delivery", label: "Delivery" }
          ].map((option) => (
            <label key={option.value} className="radio-label">
              <input
                type="radio"
                name="diningOption"
                value={option.value}
                checked={diningOption === option.value}
                onChange={() => setDiningOption(option.value)}
              />
              <span className="radio-text">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">
          <FaRulerHorizontal className="label-icon" /> Search Radius:
        </label>
        <div className="radius-slider">
          <input
            type="range"
            min="1000"
            max="40000"
            step="1000"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className="range-slider"
          />
          <div className="radius-value">
            <span>{(radius / 1000).toFixed(1)} km</span>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">
          <FaSort className="label-icon" /> Sort By:
        </label>
        <select 
          className="filter-select"
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="best_match">Best Match</option>
          <option value="rating">Highest Rated</option>
          <option value="review_count">Most Reviewed</option>
          <option value="distance">Nearest First</option>
        </select>
      </div>

      <div className="filter-actions">
        <button onClick={handleReset} className="reset-button">
          Reset All
        </button>
        <button onClick={handleApply} className="apply-button">
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default Filter;