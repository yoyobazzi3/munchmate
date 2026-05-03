import { FaFilter, FaUtensils, FaStar, FaRulerHorizontal, FaDollarSign } from "react-icons/fa";
import { Button, Chip } from "./ui";
import { METERS_PER_MILE, MIN_RADIUS_METERS, MAX_RADIUS_METERS } from "../utils/constants";
import { YELP_CATEGORIES, DINING_OPTIONS, PRICE_LEVELS } from "../utils/filterConstants";
import useToggleArray from "../hooks/useToggleArray";
import { useState } from "react";
import "./Filter.css";

const DEFAULT_RADIUS = 5000;

/**
 * Collapsible side-panel for dynamically capturing filter constraints 
 * like maximum travel radius, minimum ratings, and price bands.
 *
 * @param {Object} props
 * @param {function(Object):void} props.onApply - Dispatch callback executing filter permutations upstream.
 * @param {Object} [props.defaultValues={}] - State hydration mappings based on preferences.
 * @returns {JSX.Element}
 */
const Filter = ({ onApply, defaultValues = {} }) => {
  const [price,        setPrice       ] = useState(defaultValues.price || "");
  const [diningOption, setDiningOption] = useState("all");
  const [radius,       setRadius      ] = useState(DEFAULT_RADIUS);
  const [minRating,    setMinRating   ] = useState("");

  const initialCategories = defaultValues.category
    ? defaultValues.category.split(",").filter(Boolean)
    : [];
  const [categories, toggleCategory, setCategories] = useToggleArray(initialCategories);

  const handleApply = () => {
    onApply({ price, diningOption, radius, category: categories.join(","), minRating, sortBy: "best_match" });
  };

  const handleClear = () => {
    const resetPrice      = defaultValues.price || "";
    const resetCategories = defaultValues.category
      ? defaultValues.category.split(",").filter(Boolean)
      : [];
    setPrice(resetPrice);
    setDiningOption("all");
    setRadius(DEFAULT_RADIUS);
    setCategories(resetCategories);
    setMinRating("");
    onApply({
      price: resetPrice,
      diningOption: "all",
      radius: DEFAULT_RADIUS,
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
        <label className="filter-label"><FaUtensils className="label-icon" /> Category:</label>
        <div className="cuisine-chips">
          {YELP_CATEGORIES.map((cat) => (
            <Chip
              key={cat.value}
              selected={categories.includes(cat.value)}
              onClick={() => toggleCategory(cat.value)}
            >
              {cat.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label"><FaDollarSign className="label-icon" /> Price Range:</label>
        <div className="price-buttons">
          {PRICE_LEVELS.map((p) => (
            <Chip
              key={p}
              variant="price"
              selected={parseInt(price) === p}
              onClick={() => setPrice((prev) => (prev === p.toString() ? "" : p.toString()))}
            >
              {"$".repeat(p)}
            </Chip>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label"><FaStar className="label-icon" /> Minimum Rating:</label>
        <select className="filter-select" value={minRating} onChange={(e) => setMinRating(e.target.value)}>
          <option value="">Any Rating</option>
          <option value="4.5">4.5+ ⭐</option>
          <option value="4">4+ ⭐</option>
          <option value="3.5">3.5+ ⭐</option>
        </select>
      </div>

      <div className="filter-section">
        <label className="filter-label">Dining Options:</label>
        <div className="dining-options">
          {DINING_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`dining-option-btn${diningOption === option.value ? " dining-option-btn--active" : ""}`}
              onClick={() => setDiningOption(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label"><FaRulerHorizontal className="label-icon" /> Search Radius:</label>
        <div className="radius-slider">
          <input
            type="range"
            min={MIN_RADIUS_METERS}
            max={MAX_RADIUS_METERS}
            step={MIN_RADIUS_METERS}
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
        <Button variant="ghost" onClick={handleClear}>Clear Filters</Button>
        <Button variant="primary" onClick={handleApply}>Apply Filters</Button>
      </div>
    </div>
  );
};

export default Filter;
