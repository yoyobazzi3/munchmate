import { memo } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";

function getOpenStatus(currentOpeningHours) {
  if (!currentOpeningHours) return null;
  const { openNow, periods } = currentOpeningHours;
  if (!openNow) return { status: "closed" };

  const now = new Date();
  const todayDay = now.getDay();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const activePeriod = periods?.find(p => {
    if (!p.close) return false;
    const openDay = p.open.day;
    const openMins = p.open.hour * 60 + (p.open.minute || 0);
    const closeDay = p.close.day;
    const closeMins = p.close.hour * 60 + (p.close.minute || 0);

    if (openDay === todayDay && closeDay === todayDay) return nowMins >= openMins && nowMins < closeMins;
    if (openDay === todayDay && closeDay === (todayDay + 1) % 7) return nowMins >= openMins;
    if (closeDay === todayDay && openDay === (todayDay + 6) % 7) return nowMins < closeMins;
    return false;
  });

  if (!activePeriod?.close) return { status: "open", minsUntilClose: null };

  const closeMins = activePeriod.close.hour * 60 + (activePeriod.close.minute || 0);
  const minsUntilClose = activePeriod.close.day === todayDay
    ? closeMins - nowMins
    : (24 * 60 - nowMins) + closeMins;

  return { status: "open", minsUntilClose };
}

const RestaurantCard = memo(({ restaurant, onClick, isFavorited, onToggleFavorite }) => {
  const openStatus = getOpenStatus(restaurant.currentOpeningHours);
  const showClosingSoon = openStatus?.status === "open" && openStatus.minsUntilClose !== null && openStatus.minsUntilClose <= 60;

  let badgeClass = null;
  let badgeLabel = null;
  if (openStatus?.status === "closed") {
    badgeClass = "status-badge status-badge--closed";
    badgeLabel = "Closed";
  } else if (showClosingSoon) {
    badgeClass = "status-badge status-badge--closing-soon";
    badgeLabel = `Closes in ${openStatus.minsUntilClose} min`;
  } else if (openStatus?.status === "open") {
    badgeClass = "status-badge status-badge--open";
    badgeLabel = "Open";
  }

  return (
    <div
      className="restaurant-card"
      onClick={() => onClick(restaurant.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick(restaurant.id)}
      aria-label={`View details for ${restaurant.name}`}
    >
      <div className="restaurant-card-img-wrapper">
        <img
          src={restaurant.image_url || "/restaurant-placeholder.svg"}
          alt={restaurant.name}
          className="restaurant-image"
          loading="lazy"
        />
        {badgeLabel && <span className={badgeClass}>{badgeLabel}</span>}
        {onToggleFavorite && (
          <button
            className={`heart-btn${isFavorited ? " heart-btn--active" : ""}`}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(restaurant.id); }}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorited ? <FaHeart /> : <FaRegHeart />}
          </button>
        )}
      </div>
      <h3>{restaurant.name}</h3>
      <p>⭐ {restaurant.rating} ({restaurant.review_count})</p>
      <p>{restaurant.price || "N/A"}</p>
      <p>{restaurant.location?.address1}</p>
    </div>
  );
});

export default RestaurantCard;
