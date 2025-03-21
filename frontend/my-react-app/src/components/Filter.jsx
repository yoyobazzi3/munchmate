import { useState } from "react";
import "./Filter.css";

const Filter = ({ onApply }) => {
  const [price, setPrice] = useState("");
  const [diningOption, setDiningOption] = useState("all");
  const [radius, setRadius] = useState(5000);
  const [category, setCategory] = useState(""); // Yelp-friendly category
  const [minRating, setMinRating] = useState("");
  const [sortBy, setSortBy] = useState("best_match");

  const yelpCategories = [
    { label: "All", value: "" },
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

  return (
    <div className="filter-container">
      <h3>Filters</h3>
      <p>Refine your restaurant search</p>

      {/* Category (Yelp) */}
      <label>Category:</label>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {yelpCategories.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>

      {/* Price Range */}
      <label>Price Range:</label>
      <div className="price-slider">
        <input
          type="range"
          min="1"
          max="4"
          step="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <span>Selected: {"$".repeat(price || 1)}</span>
      </div>

      {/* Minimum Rating */}
      <label>Minimum Rating:</label>
      <select value={minRating} onChange={(e) => setMinRating(e.target.value)}>
        <option value="">All</option>
        <option value="4.5">4.5+ ⭐</option>
        <option value="4">4+ ⭐</option>
        <option value="3.5">3.5+ ⭐</option>
      </select>

      {/* Dining Options */}
      <label>Dining Options:</label>
      <div className="dining-options">
        {["all", "dine-in", "takeout", "delivery"].map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="diningOption"
              value={option}
              checked={diningOption === option}
              onChange={() => setDiningOption(option)}
            />
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </label>
        ))}
      </div>

      {/* Radius */}
      <label>Search Radius (meters):</label>
      <input
        type="number"
        value={radius}
        onChange={(e) => setRadius(e.target.value)}
        min="1000"
        max="40000"
        step="1000"
      />

      {/* Sort By */}
      <label>Sort By:</label>
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
        <option value="best_match">Best Match</option>
        <option value="rating">Rating</option>
        <option value="review_count">Most Reviewed</option>
        <option value="distance">Distance</option>
      </select>

      {/* Apply Button */}
      <button onClick={handleApply}>Apply Filters</button>
    </div>
  );
};

export default Filter;