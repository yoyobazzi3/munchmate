import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import axios from "axios";
import { clearAllTokens } from "../utils/tokenService";
import "./Profile.css";

const CUISINES = ["Italian", "Japanese", "Mexican", "Indian", "Chinese", "American", "Pizza", "Burgers", "Sushi"];

const Profile = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [favoriteCuisines, setFavoriteCuisines] = useState([]);
  const [preferredPriceRange, setPreferredPriceRange] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        setFavoriteCuisines(data.favoriteCuisines || []);
        setPreferredPriceRange(data.preferredPriceRange || "");
      })
      .catch(() => {});
  }, [token]);

  const toggleCuisine = (cuisine) => {
    setFavoriteCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
    setSaveMsg("");
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/preferences`,
        { favoriteCuisines, preferredPriceRange },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaveMsg("Preferences saved!");
    } catch {
      setSaveMsg("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearAllTokens();
    navigate("/auth?mode=login");
  };

  return (
    <div className="profile-page">
      <div className="profile-nav">
        <button className="back-btn" onClick={() => navigate("/home")}>
          <FaArrowLeft /> Back
        </button>
        <span className="profile-nav-title">Profile</span>
      </div>

      <div className="profile-container">
        <div className="profile-avatar">
          <img src="/default-avatar.svg" alt="Avatar" />
        </div>

        <h2 className="profile-name">{user.firstName} {user.lastName}</h2>
        <p className="profile-email">{user.email}</p>

        <div className="profile-card">
          <div className="profile-field">
            <span className="field-label">First Name</span>
            <span className="field-value">{user.firstName}</span>
          </div>
          <div className="profile-field">
            <span className="field-label">Last Name</span>
            <span className="field-value">{user.lastName}</span>
          </div>
          <div className="profile-field">
            <span className="field-label">Email</span>
            <span className="field-value">{user.email}</span>
          </div>
        </div>

        <div className="profile-card preferences-card">
          <h3 className="preferences-title">Food Preferences</h3>

          <div className="preference-section">
            <span className="field-label">Favorite Cuisines</span>
            <div className="cuisine-chips">
              {CUISINES.map((c) => (
                <button
                  key={c}
                  className={`cuisine-chip ${favoriteCuisines.includes(c) ? "selected" : ""}`}
                  onClick={() => toggleCuisine(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="preference-section">
            <span className="field-label">Preferred Price Range</span>
            <div className="price-options">
              {["$", "$$", "$$$", "$$$$"].map((p) => (
                <button
                  key={p}
                  className={`price-chip ${preferredPriceRange === p ? "selected" : ""}`}
                  onClick={() => {
                    setPreferredPriceRange((prev) => (prev === p ? "" : p));
                    setSaveMsg("");
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {saveMsg && <p className="save-msg">{saveMsg}</p>}

          <button className="save-prefs-btn" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>

        <button className="logout-btn-profile" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Profile;
