import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";
import { clearUser, getUser } from "../utils/tokenService";
import Navbar from "../components/Navbar";
import { CUISINES, PRICE_LABELS } from "../utils/constants";
import "./Profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const user = getUser() || {};
  // No need to manually read the token — the api instance attaches it automatically

  const [favoriteCuisines, setFavoriteCuisines] = useState([]);
  const [preferredPriceRange, setPreferredPriceRange] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    // Load current preferences when the profile page mounts
    api
      .get("/preferences")
      .then(({ data }) => {
        setFavoriteCuisines(data.favoriteCuisines || []);
        setPreferredPriceRange(data.preferredPriceRange || "");
      })
      .catch(() => {});
  }, []);

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
      // Save updated preferences via the centralized api instance
      await api.put("/preferences", { favoriteCuisines, preferredPriceRange });
      setSaveMsg("Preferences saved!");
    } catch {
      setSaveMsg("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Tell the backend to clear the HttpOnly token cookies
      await api.post("/logout");
    } finally {
      // Always clear local user info and redirect, even if the request fails
      clearUser();
      navigate("/auth?mode=login");
    }
  };

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="profile-page">

      <Navbar variant="inner" title="My Profile" backPath="/home" />

      {/* Hero banner */}
      <div className="profile-hero">
        <div className="profile-avatar-wrapper">
          {initials ? (
            <div className="profile-avatar-initial">{initials}</div>
          ) : (
            <img src="/default-avatar.svg" alt="Avatar" className="profile-avatar-img" />
          )}
        </div>
        <div className="profile-hero-info">
          <h2>{user.firstName} {user.lastName}</h2>
          <p>{user.email}</p>
        </div>
      </div>

      {/* Content */}
      <div className="profile-container">

        {/* Account Info card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h3>Account Info</h3>
          </div>
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

        {/* Food Preferences card */}
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
              {PRICE_LABELS.map((p) => (
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

        {/* Logout */}
        <button className="logout-btn-profile" onClick={handleLogout}>
          Log Out
        </button>

      </div>
    </div>
  );
};

export default Profile;
