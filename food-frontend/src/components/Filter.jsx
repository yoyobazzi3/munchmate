import { useState } from "react";
import { FaFilter, FaUtensils, FaStar, FaRulerHorizontal, FaDollarSign } from "react-icons/fa";
import "./Filter.css";

const METERS_PER_MILE = 1609.34;

const Filter = ({ onApply, defaultValues = {} }) => {
  const [price, setPrice] = useState(defaultValues.price || "");
  const [diningOption, setDiningOption] = useState("all");
  const [radius, setRadius] = useState(5000);
  const [categories, setCategories] = useState(
    defaultValues.category ? defaultValues.category.split(",").filter(Boolean) : []
  );
  const [minRating, setMinRating] = useState("");

  const yelpCategories = [
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

  const toggleCategory = (value) => {
    setCategories(prev =>
      prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
    );
  };

  const handleApply = () => {
    onApply({
      price,
      diningOption,
      radius,
      category: categories.join(","),
      minRating,
      sortBy: "best_match",
    });
  };

  const handleClear = () => {
    const resetPrice = defaultValues.price || "";
    const resetCategories = defaultValues.category
      ? defaultValues.category.split(",").filter(Boolean)
      : [];
    setPrice(resetPrice);
    setDiningOption("all");
    setRadius(5000);
    setCategories(resetCategories);
    setMinRating("");
    onApply({
      price: resetPrice,
      diningOption: "all",
      radius: 5000,
      category: resetCategories.join(","),
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
        <div className="cuisine-chips">
          {yelpCategories.map((cat) => (
            <button
              key={cat.value}
              className={`cuisine-chip ${categories.includes(cat.value) ? "active" : ""}`}
              onClick={() => toggleCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">
          <FaDollarSign className="label-icon" /> Price Range:
        </label>
        <div className="price-buttons">
          {[1, 2, 3, 4].map((p) => (
            <button
              key={p}
              className={`price-button ${parseInt(price) === p ? "active" : ""}`}
              onClick={() => setPrice(prev => prev === p.toString() ? "" : p.toString())}
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
            { value: "delivery", label: "Delivery" },
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
            min="1609"
            max="40234"
            step="1609"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="range-slider"
          />
          <div className="radius-value">
            <span>{Math.round(radius / METERS_PER_MILE)} mi</span>
          </div>
        </div>
      </div>

      <div className="filter-actions">
        <button onClick={handleClear} className="reset-button">
          Clear Filters
        </button>
        <button onClick={handleApply} className="apply-button">
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default Filter;
