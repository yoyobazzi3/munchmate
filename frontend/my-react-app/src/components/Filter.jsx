import { useState } from "react";
import "./Filter.css";

const Filter = ({ onApply }) => {
  const [price, setPrice] = useState("");
  const [diningOption, setDiningOption] = useState("all");
  const [radius, setRadius] = useState(5000);
  const [type, setType] = useState("restaurant"); // Default place type
  const [minRating, setMinRating] = useState("");

  // Google Place API place types
  const placeTypes = ["restaurant", "cafe", "bar", "bakery", "meal_takeaway", "meal_delivery"];

  const handleApply = () => {
    onApply({
      price,
      diningOption,
      radius,
      type,
      minRating,
    });
  };

  return (
    <div className="filter-container">
      <h3>Filters</h3>

      {/* Price Range Slider */}
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

      {/* Place Type Filtering */}
      <label>Place Type:</label>
      <select value={type} onChange={(e) => setType(e.target.value)}>
        {placeTypes.map((placeType) => (
          <option key={placeType} value={placeType}>
            {placeType.replace("_", " ").toUpperCase()}
          </option>
        ))}
      </select>

      {/* Minimum Rating Filtering */}
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
            {option.charAt(0).toUpperCase() + option.slice(1).replace("-", " ")}
          </label>
        ))}
      </div>

      {/* Radius Input */}
      <label>Search Radius (meters):</label>
      <input
        type="number"
        value={radius}
        onChange={(e) => setRadius(e.target.value)}
        min="1000"
        max="50000"
        step="1000"
      />

      {/* Apply Filters Button */}
      <button onClick={handleApply}>Apply Filters</button>
    </div>
  );
};

export default Filter;