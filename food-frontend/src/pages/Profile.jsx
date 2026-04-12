import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";
import { clearUser, getUser } from "../utils/tokenService";
import { AUTH_ROUTES } from "../utils/routes";
import { ENDPOINTS } from "../utils/apiEndpoints";
import Navbar from "../components/Navbar";
import { Button, Chip } from "../components/ui";
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
      .get(ENDPOINTS.PREFERENCES.GET)
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
      await api.put(ENDPOINTS.PREFERENCES.SAVE, { favoriteCuisines, preferredPriceRange });
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
      await api.post(ENDPOINTS.AUTH.LOGOUT);
    } finally {
      // Always clear local user info and redirect, even if the request fails
      clearUser();
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

          {saveMsg && <p className="save-msg">{saveMsg}</p>}

          <Button variant="primary" fullWidth onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>

        {/* Logout */}
        <Button variant="danger" fullWidth onClick={handleLogout}>
          Log Out
        </Button>

      </div>
    </div>
  );
};

export default Profile;
