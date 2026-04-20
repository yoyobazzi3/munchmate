import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePreferences } from "../context/PreferencesContext";
import { logout } from "../services/authService";
import { useUser } from "../context/UserContext";
import { AUTH_ROUTES } from "../utils/routes";
import Navbar from "../components/Navbar";
import { Button, Chip } from "../components/ui";
import { CUISINES, PRICE_LABELS } from "../utils/constants";
import useToggleArray from "../hooks/useToggleArray";
import { getDiningInsights } from "../services/diningInsightsService";
import "./Profile.css";

/**
 * User profile overview page allowing the editing of food preferences independently
 * and managing overall application authentication scope natively.
 *
 * @component
 * @returns {JSX.Element} Profile interface.
 */
const Profile = () => {
  const navigate = useNavigate();
  const { user = {}, logoutUser } = useUser();

  const [favoriteCuisines, toggleCuisineItem, setFavoriteCuisines] = useToggleArray([]);
  const [preferredPriceRange, setPreferredPriceRange] = useState("");
  const [likedFoods, setLikedFoods] = useState("");
  const [dislikedFoods, setDislikedFoods] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    getDiningInsights().then(setInsights).catch(() => {});
  }, []);

  const { preferences, savePreferences } = usePreferences();

  // Populate form fields once preferences are loaded
  useEffect(() => {
    if (!preferences) return;
    setFavoriteCuisines(preferences.favoriteCuisines || []);
    setPreferredPriceRange(preferences.preferredPriceRange || "");
    setLikedFoods(preferences.likedFoods || "");
    setDislikedFoods(preferences.dislikedFoods || "");
  }, [preferences, setFavoriteCuisines]);

  /**
   * Wrapper for toggling specific cuisines while clearing saving feedback automatically.
   * 
   * @param {string} cuisine - Cuisine name.
   */
  const toggleCuisine = (cuisine) => {
    toggleCuisineItem(cuisine);
    setSaveMsg("");
  };

  /**
   * Triggers the saving mutations natively back to the central repository.
   */
  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      await savePreferences({ favoriteCuisines, preferredPriceRange, likedFoods, dislikedFoods });
      setSaveMsg("Preferences saved!");
    } catch {
      setSaveMsg("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Terminates securely the user session and drops the HTTP only context seamlessly.
   */
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      logoutUser();
      navigate(AUTH_ROUTES.LOGIN);
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
                <Chip
                  key={c}
                  selected={favoriteCuisines.includes(c)}
                  onClick={() => toggleCuisine(c)}
                >
                  {c}
                </Chip>
              ))}
            </div>
          </div>

          <div className="preference-section">
            <span className="field-label">Preferred Price Range</span>
            <div className="price-options">
              {PRICE_LABELS.map((p) => (
                <Chip
                  key={p}
                  variant="price"
                  selected={preferredPriceRange === p}
                  onClick={() => {
                    setPreferredPriceRange((prev) => (prev === p ? "" : p));
                    setSaveMsg("");
                  }}
                >
                  {p}
                </Chip>
              ))}
            </div>
          </div>

          <div className="preference-section">
            <span className="field-label">Foods I Love</span>
            <textarea
              className="preference-textarea"
              placeholder="e.g. sushi, pasta, tacos..."
              value={likedFoods}
              onChange={(e) => { setLikedFoods(e.target.value); setSaveMsg(""); }}
            />
          </div>

          <div className="preference-section">
            <span className="field-label">Foods I Dislike</span>
            <textarea
              className="preference-textarea"
              placeholder="e.g. mushrooms, spicy food..."
              value={dislikedFoods}
              onChange={(e) => { setDislikedFoods(e.target.value); setSaveMsg(""); }}
            />
          </div>

          {saveMsg && <p className="save-msg">{saveMsg}</p>}

          <Button variant="primary" fullWidth onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>

        {/* Dining Insights card */}
        {insights && (
          <div className="profile-card preferences-card">
            <h3 className="preferences-title">Dining Insights</h3>
            <div className="insights-grid">
              <div className="insight-item">
                <span className="insight-value">
                  {insights.thisWeek}
                  {insights.trend === 'up' && <span className="trend-up"> ↑</span>}
                  {insights.trend === 'down' && <span className="trend-down"> ↓</span>}
                </span>
                <span className="insight-label">Restaurants explored this week</span>
              </div>
              {insights.topPriceRange && (
                <div className="insight-item">
                  <span className="insight-value">{insights.topPriceRange}</span>
                  <span className="insight-label">Your most browsed price range</span>
                </div>
              )}
              {insights.topCuisine && (
                <div className="insight-item">
                  <span className="insight-value insight-cuisine">{insights.topCuisine.replace(/_/g, ' ')}</span>
                  <span className="insight-label">Top cuisine you keep exploring</span>
                </div>
              )}
            </div>
            {insights.topPriceRange && (
              <p className="insight-summary">
                Based on your activity, you lean toward <strong>{insights.topPriceRange}</strong> dining experiences.
              </p>
            )}
          </div>
        )}

        {/* Logout */}
        <Button variant="danger" fullWidth onClick={handleLogout}>
          Log Out
        </Button>

      </div>
    </div>
  );
};

export default Profile;
