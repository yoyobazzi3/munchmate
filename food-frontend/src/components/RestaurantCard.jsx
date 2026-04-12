import { memo } from "react";

/**
 * A reusable presentational component for displaying brief restaurant 
 * highlights in a grid or row layout.
 *
 * @param {Object} props
 * @param {Object} props.restaurant - The restaurant data object.
 * @param {function(string): void} props.onClick - Click handler passing the restaurant ID.
 * @returns {JSX.Element}
 */
const RestaurantCard = memo(({ restaurant, onClick }) => (
  <div className="restaurant-card" onClick={() => onClick(restaurant.id)}>
    <img
      src={restaurant.image_url || "https://via.placeholder.com/200"}
      alt={restaurant.name}
      className="restaurant-image"
      loading="lazy"
    />
    <h3>{restaurant.name}</h3>
    <p>⭐ {restaurant.rating} ({restaurant.review_count})</p>
    <p>{restaurant.price || "N/A"}</p>
    <p>{restaurant.location?.address1}</p>
  </div>
));

export default RestaurantCard;
