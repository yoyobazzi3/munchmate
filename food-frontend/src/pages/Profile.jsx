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
import { getDiningInsights, getSpendingInsights } from "../services/diningInsightsService";
import { getTasteProfile, getVisitedSummary } from "../services/favoritesService";
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
  const [tasteProfile, setTasteProfile] = useState(null);
  const [spendingInsights, setSpendingInsights] = useState(null);
  const [visitedPlaces, setVisitedPlaces] = useState([]);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    setProfileLoading(true);
    Promise.allSettled([
      getDiningInsights().then(setInsights),
      getTasteProfile().then(setTasteProfile),
      getSpendingInsights().then(setSpendingInsights),
      getVisitedSummary().then(data => setVisitedPlaces(Array.isArray(data) ? data : [])),
    ]).finally(() => setProfileLoading(false));
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

  const [activeTab, setActiveTab] = useState("overview");
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  const tabs = [
    { id: "overview",     icon: "↗", label: "Overview" },
    { id: "preferences",  icon: "🍴", label: "Preferences" },
    { id: "account",      icon: "👤", label: "Account" },
  ];

  return (
    <div className="profile-page">

      <Navbar variant="inner" title="My Profile" backPath="/home" />

      {/* Hero banner */}
      <div className="profile-hero">
        <div className="profile-hero-left">
          <div className="profile-avatar-initial">{initials}</div>
          <div className="profile-hero-info">
            <h2>{user.firstName} {user.lastName}</h2>
            <p>{user.email}</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="profile-tab-bar-wrap">
        <div className="profile-tab-bar">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`profile-tab${activeTab === t.id ? " profile-tab--active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="profile-tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="profile-container">
          {profileLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div className="loading-spinner" />
            </div>
          )}
          {!profileLoading && (
          <>
          {/* Dining Insights — full width */}
          {insights && (
            <div className="profile-card preferences-card">
              <h3 className="card-section-title">
                <span className="card-section-icon">↗</span> Dining Insights
              </h3>
              <div className="insights-grid">
                <div className="insight-item">
                  <span className="insight-value">
                    {insights.thisWeek}
                    {insights.trend === "up" && <span className="trend-up"> ↑</span>}
                    {insights.trend === "down" && <span className="trend-down"> ↓</span>}
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
                  <div className="insight-item insight-item--cuisine">
                    <span className="insight-cuisine-icon">🍴</span>
                    <span className="insight-value insight-cuisine">
                      {insights.topCuisine.replace(/_/g, " ")}
                    </span>
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

          {/* Two-column row: Taste Profile + Dining Spend */}
          <div className="profile-two-col">

            {/* Taste Profile */}
            {tasteProfile?.insight && (
              <div className="profile-card preferences-card">
                <h3 className="card-section-title">
                  <span className="card-section-icon">✦</span> Your Taste Profile
                </h3>
                <p className="taste-profile-text">{tasteProfile.insight}</p>
                <span className="taste-profile-meta">
                  Based on {tasteProfile.ratingCount} rated restaurant{tasteProfile.ratingCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* Dining Spend */}
            <div className="profile-card preferences-card">
              <h3 className="card-section-title">
                <span className="card-section-icon">🪙</span> Dining Spend
              </h3>
              {spendingInsights?.hasData ? (
                <>
                  <div className="spend-grid">
                    <div className="insight-item">
                      <span className="spend-icon">🧾</span>
                      <span className="insight-value">${spendingInsights.total.toFixed(2)}</span>
                      <span className="insight-label">Total logged spend</span>
                    </div>
                    <div className="insight-item">
                      <span className="spend-icon">🕐</span>
                      <span className="insight-value">${spendingInsights.avgPerMeal.toFixed(2)}</span>
                      <span className="insight-label">Avg per meal</span>
                    </div>
                  </div>
                  {spendingInsights.topCategory && (
                    <div className="spend-top-category">
                      <span className="spend-top-name">{spendingInsights.topCategory.replace(/_/g, " ")}</span>
                      <span className="spend-top-label">Top spend category</span>
                    </div>
                  )}
                  {spendingInsights.summary && (
                    <p className="insight-summary">{spendingInsights.summary}</p>
                  )}
                </>
              ) : (
                <p className="insight-summary" style={{ color: "var(--color-text-muted)" }}>
                  Log your spend on visited restaurants to see insights here.
                </p>
              )}
            </div>

          </div>

          {/* Visited Places — full width */}
          <div className="profile-card preferences-card">
            <div className="visited-header">
              <h3 className="card-section-title">
                <span className="card-section-icon">📍</span> Visited Places
              </h3>
              {visitedPlaces.length > 0 && (
                <span className="visited-count-badge">{visitedPlaces.length} place{visitedPlaces.length !== 1 ? "s" : ""}</span>
              )}
            </div>
            {visitedPlaces.length === 0 ? (
              <p className="insight-summary" style={{ color: "var(--color-text-muted)" }}>
                Mark restaurants as visited to track your dining history here.
              </p>
            ) : (
              <ul className="visited-list">
                {visitedPlaces.map((place) => (
                  <li key={place.id} className="visited-item">
                    <div className="visited-item__info">
                      <span className="visited-item__name">{place.name}</span>
                      {place.category && (
                        <span className="visited-item__category">{place.category.replace(/_/g, " ")}</span>
                      )}
                    </div>
                    <div className="visited-item__right">
                      {parseInt(place.visit_count) > 0 ? (
                        <>
                          <span className="visited-item__total">${parseFloat(place.total_spent).toFixed(2)}</span>
                          <span className="visited-item__count">{place.visit_count} visit{place.visit_count !== 1 ? "s" : ""}</span>
                        </>
                      ) : (
                        <span className="visited-item__no-spend">No spend logged</span>
                      )}
                    </div>
                    <span className="visited-item__arrow">›</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          </>)}
        </div>
      )}

      {/* ── PREFERENCES ── */}
      {activeTab === "preferences" && (
        <div className="profile-container profile-container--narrow">
          <div className="profile-card preferences-card">
            <h3 className="card-section-title">
              <span className="card-section-icon">🍴</span> Food Preferences
            </h3>
            <p className="preferences-subtitle">Help us personalize your dining recommendations</p>

            <div className="preference-section">
              <span className="field-label">
                Favorite Cuisines <span className="cuisine-count">{favoriteCuisines.length} selected</span>
              </span>
              <div className="cuisine-chips">
                {CUISINES.map((c) => (
                  <Chip key={c} selected={favoriteCuisines.includes(c)} onClick={() => toggleCuisine(c)}>
                    {c}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="preference-section">
              <span className="field-label">
                <span className="pref-icon">$</span> Preferred Price Range
              </span>
              <div className="price-options">
                {PRICE_LABELS.map((p) => (
                  <Chip
                    key={p}
                    variant="price"
                    selected={preferredPriceRange === p}
                    onClick={() => { setPreferredPriceRange((prev) => (prev === p ? "" : p)); setSaveMsg(""); }}
                  >
                    {p}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="preference-section preference-section--two-col">
              <div>
                <span className="field-label"><span className="pref-icon">♡</span> Foods I Love</span>
                <textarea
                  className="preference-textarea"
                  placeholder="e.g. sushi, pasta, tacos..."
                  value={likedFoods}
                  onChange={(e) => { setLikedFoods(e.target.value); setSaveMsg(""); }}
                />
              </div>
              <div>
                <span className="field-label"><span className="pref-icon">👎</span> Foods I Dislike</span>
                <textarea
                  className="preference-textarea"
                  placeholder="e.g. mushrooms, spicy food..."
                  value={dislikedFoods}
                  onChange={(e) => { setDislikedFoods(e.target.value); setSaveMsg(""); }}
                />
              </div>
            </div>

            {saveMsg && <p className="save-msg">{saveMsg}</p>}

            <Button variant="primary" fullWidth onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>
      )}

      {/* ── ACCOUNT ── */}
      {activeTab === "account" && (
        <div className="profile-container profile-container--narrow">
          <div className="profile-card preferences-card">
            <div className="account-card-header">
              <h3 className="card-section-title">
                <span className="card-section-icon">👤</span> Account Info
              </h3>
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

          <Button variant="danger" fullWidth onClick={handleLogout}>
            Log Out
          </Button>
        </div>
      )}

    </div>
  );
};

export default Profile;
