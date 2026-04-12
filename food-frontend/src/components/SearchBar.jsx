import { useState, useEffect, useRef } from "react";
import { FaSearch, FaHistory, FaUtensils } from "react-icons/fa";
import { Spinner } from "./ui";
import useSuggestions from "../hooks/useSuggestions";
import "./SearchBar.css";

const SUGGESTION_ICONS = {
  restaurant: <FaUtensils className="suggestion-icon" />,
  cuisine   : <FaUtensils className="suggestion-icon" />,
};

/**
 * Interactive search bar integrating autocomplete suggestions 
 * leveraging user bounds and physical location tracking.
 *
 * @param {Object} props
 * @param {function(string):void} props.onSearch - Event emitted when a query term is submitted.
 * @param {Object} [props.userLocation] - Optional geolocation restrictions for suggestions.
 * @returns {JSX.Element}
 */
const SearchBar = ({ onSearch, userLocation }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused,  setIsFocused ] = useState(false);
  const searchRef = useRef(null);

  const { suggestions, isLoading, clearSuggestions } = useSuggestions(searchTerm, userLocation);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        clearSuggestions();
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [clearSuggestions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
      clearSuggestions();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.text);
    onSearch(suggestion.text);
    clearSuggestions();
  };

  return (
    <div className="search-bar-container" ref={searchRef}>
      <form className="search-bar" onSubmit={handleSubmit}>
        <div className="search-input-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search for restaurants, cuisines, or dishes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsFocused(true)}
            aria-label="Search restaurants"
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-button"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <button type="submit" className="search-button">Search</button>
      </form>

      {isFocused && (suggestions.length > 0 || isLoading) && (
        <div className="suggestions-container">
          {isLoading ? (
            <div className="suggestion-loading">
              <Spinner size="sm" />
              <span>Finding restaurants...</span>
            </div>
          ) : (
            <ul className="suggestions-list">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`suggestion-item ${suggestion.type}`}
                >
                  {SUGGESTION_ICONS[suggestion.type] ?? <FaHistory className="suggestion-icon" />}
                  <span>{suggestion.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
