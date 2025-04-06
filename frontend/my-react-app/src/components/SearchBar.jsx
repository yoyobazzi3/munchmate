import { useState, useEffect, useRef } from "react";
import { FaSearch, FaHistory, FaUtensils } from "react-icons/fa";
import axios from "axios";
import "./SearchBar.css";

const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchTerm.length > 1) {
        fetchSuggestions(searchTerm);
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  useEffect(() => {
    // Handle clicks outside of search component to close suggestions
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSuggestions([]);
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchSuggestions = async (term) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/getRestaurants`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          term,
          latitude: 37.7749, // Default to San Francisco for suggestions
          longitude: -122.4194,
          limit: 5
        }
      });
      
      // Format each suggestion with a type (restaurant)
      const restaurantSuggestions = response.data.map((r) => ({
        text: r.name,
        type: 'restaurant',
        id: r.id
      }));
      
      // Add some cuisine type suggestions based on the search term
      const cuisineSuggestions = [];
      if (term.length > 2) {
        const cuisines = ['Italian', 'Mexican', 'Chinese', 'Indian', 'Japanese', 'Thai', 'American'];
        const matchingCuisines = cuisines.filter(cuisine => 
          cuisine.toLowerCase().includes(term.toLowerCase())
        ).slice(0, 2);
        
        matchingCuisines.forEach(cuisine => {
          cuisineSuggestions.push({
            text: cuisine + ' Restaurants',
            type: 'cuisine',
            id: cuisine.toLowerCase()
          });
        });
      }
      
      setSuggestions([...cuisineSuggestions, ...restaurantSuggestions]);
      setIsLoading(false);
    } catch (error) {
      console.error("Suggestion error:", error);
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.text);
    onSearch(suggestion.text);
    setSuggestions([]);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'restaurant':
        return <FaUtensils className="suggestion-icon" />;
      case 'cuisine':
        return <FaUtensils className="suggestion-icon" />;
      default:
        return <FaHistory className="suggestion-icon" />;
    }
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
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <button type="submit" className="search-button">
          Search
        </button>
      </form>

      {isFocused && (suggestions.length > 0 || isLoading) && (
        <div className="suggestions-container">
          {isLoading ? (
            <div className="suggestion-loading">
              <div className="loading-spinner"></div>
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
                  {getIcon(suggestion.type)}
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