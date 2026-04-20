import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useFavorites from "../hooks/useFavorites";
import RestaurantCard from "../components/RestaurantCard";
import RestaurantDetailsModal from "../components/RestaurantDetailsModal";
import Navbar from "../components/Navbar";
import { Chip } from "../components/ui";
import { ROUTES } from "../utils/routes";
import {
  FaHeart,
  FaUtensils,
  FaStar,
  FaArrowRight,
  FaFilter,
  FaDollarSign,
} from "react-icons/fa";
import "./Favorites.css";

const SORT_OPTIONS = [
  { value: "saved",  label: "Recently Saved" },
  { value: "rating", label: "Top Rated" },
  { value: "az",     label: "A – Z" },
];

const PRICE_LEVELS = [1, 2, 3, 4];

/* ── Sub-components ──────────────────────────────────────────── */

const StatCard = ({ icon, value, label }) => (
  <div className="fav-stat">
    <span className="fav-stat__icon">{icon}</span>
    <span className="fav-stat__value">{value}</span>
    <span className="fav-stat__label">{label}</span>
  </div>
);

const SpotlightCard = ({ restaurant, onOpen, isFavorited, onToggleFavorite }) => (
  <div className="fav-spotlight" onClick={() => onOpen(restaurant.id)}>
    <div
      className="fav-spotlight__img"
      style={{ backgroundImage: `url(${restaurant.image_url || "/restaurant-placeholder.svg"})` }}
    />
    <div className="fav-spotlight__body">
      <span className="fav-spotlight__eyebrow">Try This Week</span>
      <h2 className="fav-spotlight__name">{restaurant.name}</h2>
      <div className="fav-spotlight__meta">
        <span>⭐ {restaurant.rating}</span>
        {restaurant.price && <span>{restaurant.price}</span>}
      </div>
      {restaurant.location?.address1 && (
        <p className="fav-spotlight__address">{restaurant.location.address1}</p>
      )}
      <div className="fav-spotlight__actions">
        <button
          className="fav-spotlight__cta"
          onClick={(e) => { e.stopPropagation(); onOpen(restaurant.id); }}
        >
          View Details <FaArrowRight />
        </button>
        <button
          className={`heart-btn fav-spotlight__heart${isFavorited ? " heart-btn--active" : ""}`}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(restaurant.id); }}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <FaHeart />
        </button>
      </div>
    </div>
  </div>
);

const EmptyState = ({ filtered, onBrowse, onChat, onClear }) => (
  <div className="fav-empty">
    <div className="fav-empty__icon"><FaHeart /></div>
    {filtered ? (
      <>
        <h2>No matches</h2>
        <p>Try adjusting the filters to see your saved restaurants.</p>
        <button className="fav-empty__btn fav-empty__btn--primary" onClick={onClear}>
          Clear Filters
        </button>
      </>
    ) : (
      <>
        <h2>No saved restaurants yet</h2>
        <p>Tap the heart on any restaurant to save it here for later.</p>
        <div className="fav-empty__actions">
          <button className="fav-empty__btn fav-empty__btn--primary" onClick={onBrowse}>
            Browse Restaurants
          </button>
          <button className="fav-empty__btn fav-empty__btn--ghost" onClick={onChat}>
            Ask the AI
          </button>
        </div>
      </>
    )}
  </div>
);

/* ── Sidebar filter panel ────────────────────────────────────── */

const FavoritesFilter = ({ availableCuisines, filters, onChange, onClear }) => {
  const hasActive =
    filters.cuisines.length > 0 || filters.price || filters.minRating || filters.status;

  return (
    <div className="fav-filter">
      <div className="fav-filter__header">
        <h2><FaFilter className="fav-filter__icon" /> Filters</h2>
        {hasActive && (
          <button className="fav-filter__clear-link" onClick={onClear}>
            Clear all
          </button>
        )}
      </div>

      {availableCuisines.length > 0 && (
        <div className="fav-filter__section">
          <label className="fav-filter__label">
            <FaUtensils className="fav-filter__label-icon" /> Cuisine
          </label>
          <div className="fav-filter__chips">
            {availableCuisines.map(c => (
              <Chip
                key={c}
                selected={filters.cuisines.includes(c)}
                onClick={() => {
                  const next = filters.cuisines.includes(c)
                    ? filters.cuisines.filter(x => x !== c)
                    : [...filters.cuisines, c];
                  onChange({ cuisines: next });
                }}
              >
                {c}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div className="fav-filter__section">
        <label className="fav-filter__label">Status</label>
        <div className="fav-filter__status">
          {[["", "All"], ["want_to_go", "Want to Go"], ["visited", "✓ Visited"]].map(([val, label]) => (
            <button
              key={val}
              className={`fav-filter__status-btn${filters.status === val ? " fav-filter__status-btn--active" : ""}`}
              onClick={() => onChange({ status: val })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="fav-filter__section">
        <label className="fav-filter__label">
          <FaDollarSign className="fav-filter__label-icon" /> Price
        </label>
        <div className="fav-filter__prices">
          {PRICE_LEVELS.map(p => (
            <Chip
              key={p}
              variant="price"
              selected={filters.price === p.toString()}
              onClick={() => onChange({ price: filters.price === p.toString() ? "" : p.toString() })}
            >
              {"$".repeat(p)}
            </Chip>
          ))}
        </div>
      </div>

      <div className="fav-filter__section">
        <label className="fav-filter__label">
          <FaStar className="fav-filter__label-icon" /> Min Rating
        </label>
        <select
          className="fav-filter__select"
          value={filters.minRating}
          onChange={e => onChange({ minRating: e.target.value })}
        >
          <option value="">Any Rating</option>
          <option value="4.5">4.5+ ⭐</option>
          <option value="4">4.0+ ⭐</option>
          <option value="3.5">3.5+ ⭐</option>
        </select>
      </div>
    </div>
  );
};

/* ── Page ────────────────────────────────────────────────────── */

const Favorites = () => {
  const navigate = useNavigate();
  const { favorites, isFavorited, toggleFavorite, saveFavoriteUpdate, saveSpend } = useFavorites();
  const [sort, setSort] = useState("saved");
  const [selectedId, setSelectedId] = useState(null);
  const [filters, setFilters] = useState({ cuisines: [], price: "", minRating: "", status: "" });

  const updateFilter = (patch) => setFilters(f => ({ ...f, ...patch }));
  const clearFilters = () => setFilters({ cuisines: [], price: "", minRating: "", status: "" });

  const hasActiveFilters =
    filters.cuisines.length > 0 || filters.price || filters.minRating || filters.status;

  const availableCuisines = useMemo(() => {
    const set = new Set(
      favorites.flatMap(r => r.categories?.map(c => c.title) ?? [])
    );
    return [...set].sort();
  }, [favorites]);

  const spotlightRestaurant = useMemo(() => {
    if (!favorites.length) return null;
    return [...favorites].sort((a, b) => b.rating - a.rating)[0];
  }, [favorites]);

  const stats = useMemo(() => {
    if (!favorites.length) return null;
    return {
      count: favorites.length,
      cuisines: availableCuisines.length || "—",
    };
  }, [favorites, availableCuisines]);

  const priceSymbol = (n) => "$".repeat(parseInt(n));

  const filtered = useMemo(() => {
    return favorites.filter(r => {
      if (filters.status === "want_to_go" && r.status !== "want_to_go" && r.status !== undefined) return false;
      if (filters.status === "visited" && r.status !== "visited") return false;
      if (filters.cuisines.length > 0) {
        const rCuisines = r.categories?.map(c => c.title) ?? [];
        if (!filters.cuisines.some(c => rCuisines.includes(c))) return false;
      }
      if (filters.price && r.price !== priceSymbol(filters.price)) return false;
      if (filters.minRating && r.rating < parseFloat(filters.minRating)) return false;
      return true;
    });
  }, [favorites, filters]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    else if (sort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [filtered, sort]);

  return (
    <div className="favorites-page">
      <Navbar variant="inner" title="Saved Restaurants" backPath={ROUTES.RESTAURANTS} />

      {favorites.length > 0 && stats && (
        <div className="fav-hero">
          <div className="fav-stats">
            <StatCard icon={<FaHeart />} value={stats.count} label="Saved" />
            <StatCard icon={<FaUtensils />} value={stats.cuisines} label="Cuisines" />
          </div>
        </div>
      )}

      <div className="fav-layout">
        {favorites.length > 0 && (
          <aside className="fav-sidebar">
            <FavoritesFilter
              availableCuisines={availableCuisines}
              filters={filters}
              onChange={updateFilter}
              onClear={clearFilters}
            />
          </aside>
        )}

        <main className="fav-main">
          {favorites.length === 0 ? (
            <EmptyState
              filtered={false}
              onBrowse={() => navigate(ROUTES.RESTAURANTS)}
              onChat={() => navigate(ROUTES.CHATBOT)}
            />
          ) : (
            <>
              {spotlightRestaurant && !hasActiveFilters && (
                <SpotlightCard
                  restaurant={spotlightRestaurant}
                  onOpen={setSelectedId}
                  isFavorited={isFavorited(spotlightRestaurant.id)}
                  onToggleFavorite={toggleFavorite}
                />
              )}

              <div className="fav-controls">
                <span className="fav-controls__count">
                  {sorted.length} restaurant{sorted.length !== 1 ? "s" : ""}
                </span>
                <div className="fav-sort">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`fav-sort__btn${sort === opt.value ? " fav-sort__btn--active" : ""}`}
                      onClick={() => setSort(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {sorted.length === 0 ? (
                <EmptyState
                  filtered
                  onClear={clearFilters}
                />
              ) : (
                <div className="fav-grid">
                  {sorted.map(r => (
                    <RestaurantCard
                      key={r.id}
                      restaurant={r}
                      onClick={setSelectedId}
                      isFavorited={isFavorited(r.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {selectedId && (() => {
        const fav = favorites.find(r => r.id === selectedId);
        return (
          <RestaurantDetailsModal
            id={selectedId}
            onClose={() => setSelectedId(null)}
            isFavorited={isFavorited(selectedId)}
            onToggleFavorite={toggleFavorite}
            favoriteNote={fav?.note}
            favoriteStatus={fav?.status}
            favoriteRating={fav?.rating}
            favoriteAmountSpent={fav?.amount_spent}
            onSaveFavoriteUpdate={saveFavoriteUpdate}
            onSaveSpend={saveSpend}
          />
        );
      })()}
    </div>
  );
};

export default Favorites;
