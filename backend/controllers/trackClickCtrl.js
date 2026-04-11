import fetch from "node-fetch";
import { priceToSymbol, buildImageUrl } from "../utils/restaurantFormatter.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";
// All database queries are abstracted into the repository layer
import restaurantRepository from "../repositories/restaurantRepository.js";



const trackClick = async (req, res) => {
  const { restaurant_id } = req.body;
  const user_id = req.user.userId; // always use the authenticated user's ID

  if (!restaurant_id) {
    return sendError(res, "Missing restaurant_id", 400);
  }

  try {
    // 1. Log the click in user_clicks table
    await restaurantRepository.logClick(user_id, restaurant_id);

    // 2. If restaurant is cached AND already has a photo, skip the Places API call
    //    If photo_reference is null, fall through and re-fetch to update it
    const existing = await restaurantRepository.findById(restaurant_id);
    if (existing.length > 0 && existing[0].photo_reference) {
      return sendSuccess(res, { message: "Click tracked only" });
    }

    // 3. Fetch from Google Places and cache
    const apiKey = process.env.PLACES_API_KEY;
    const response = await fetch(`https://places.googleapis.com/v1/places/${restaurant_id}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,displayName,formattedAddress,location,priceLevel,rating,userRatingCount,types,photos",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return sendError(res, "Failed to fetch from Google Places", 502);
    }

    const p = await response.json();

    // 3. Cache the restaurant in our database so we don't re-fetch it next time
    await restaurantRepository.cacheRestaurant({
      id: p.id,
      name: p.displayName?.text || "",
      address: p.formattedAddress || "",
      latitude: p.location?.latitude || null,
      longitude: p.location?.longitude || null,
      price: priceToSymbol(p.priceLevel),
      rating: p.rating || 0,
      reviewCount: p.userRatingCount || 0,
      category: p.types?.[0]?.replace(/_/g, " ") || null,
      photoReference: p.photos?.[0]?.name || null,
    });

    sendSuccess(res, { message: "Click + restaurant saved" });
  } catch (err) {
    console.error("Error in trackClick:", err);
    sendError(res);
  }
};

const getClickHistory = async (req, res) => {
  const userId = req.user.userId; // ignore URL param — always use the authenticated user

  try {
    // Fetch click history rows via the restaurant repository
    const rows = await restaurantRepository.getClickHistory(userId);

    const normalized = rows.map(r => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      review_count: r.review_count,
      price: r.price,
      image_url: buildImageUrl(r.photo_reference, 400, process.env.BACKEND_URL || ''),
      location: { address1: r.address },
      coordinates: { latitude: r.latitude, longitude: r.longitude },
      categories: r.category ? [{ alias: r.category, title: r.category }] : [],
    }));

    sendSuccess(res, normalized);
  } catch (error) {
    console.error("Error fetching click history:", error);
    sendError(res);
  }
};

export default { trackClick, getClickHistory };
