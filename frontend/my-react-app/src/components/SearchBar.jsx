import { useState, useEffect } from "react";
import axios from "axios";
import "./SearchBar.css";

const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);

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

  const fetchSuggestions = async (term) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/getRestaurants`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          term,
          latitude: 37.7749,
          longitude: -122.4194,
          limit: 5
        }
      });
      setSuggestions(response.data.map((r) => r.name));
    } catch (error) {
      console.error("Suggestion error:", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm.trim());
    setSuggestions([]);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    onSearch(suggestion);
    setSuggestions([]);
  };

  return (
    <div className="search-bar-wrapper">
      <form className="search-bar" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Search for a restaurant..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((sugg, index) => (
            <li key={index} onClick={() => handleSuggestionClick(sugg)}>
              {sugg}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;