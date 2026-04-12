import { memo } from "react";

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
