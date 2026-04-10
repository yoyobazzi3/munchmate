import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

// Convert Google day (0=Sun) to Yelp day (0=Mon)
const googleToYelpDay = d => (d === 0 ? 6 : d - 1);

const toYelpTime = (hour, minute) =>
  String(hour).padStart(2, "0") + String(minute || 0).padStart(2, "0");

const priceToSymbol = (level) => ({
  PRICE_LEVEL_FREE: "$",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
}[level] || null);

const getComponent = (components, type) =>
  components?.find(c => c.types?.includes(type))?.longText || "";

const getRestaurantDetails = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing restaurant ID" });

  try {
    const apiKey = process.env.PLACES_API_KEY;

    const response = await fetch(`https://places.googleapis.com/v1/places/${id}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "id", "displayName", "rating", "userRatingCount", "priceLevel",
          "formattedAddress", "addressComponents", "location", "photos",
          "types", "googleMapsUri", "nationalPhoneNumber", "regularOpeningHours",
          "websiteUri",
        ].join(","),
      },
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err });
    }

    const p = await response.json();

    // Build photo URLs (up to 5) — proxied to keep the API key server-side
    const backendUrl = process.env.BACKEND_URL || '';
    const photos = (p.photos || []).slice(0, 5).map(
      photo => `${backendUrl}/image-proxy?ref=${encodeURIComponent(photo.name)}&w=800`
    );

    // Convert opening hours to Yelp format
    let hours = undefined;
    if (p.regularOpeningHours?.periods?.length) {
      const open = p.regularOpeningHours.periods.map(period => ({
        day: googleToYelpDay(period.open.day),
        start: toYelpTime(period.open.hour, period.open.minute),
        end: toYelpTime(period.close?.hour ?? 23, period.close?.minute ?? 59),
      }));
      hours = [{ open }];
    }

    const components = p.addressComponents || [];

    res.json({
      id: p.id,
      name: p.displayName?.text || "",
      rating: p.rating || 0,
      review_count: p.userRatingCount || 0,
      price: priceToSymbol(p.priceLevel),
      phone: p.nationalPhoneNumber || "",
      url: p.googleMapsUri || p.websiteUri || "",
      photos,
      hours,
      location: {
        address1: `${getComponent(components, "street_number")} ${getComponent(components, "route")}`.trim()
          || p.formattedAddress || "",
        city: getComponent(components, "locality"),
        state: getComponent(components, "administrative_area_level_1"),
        zip_code: getComponent(components, "postal_code"),
      },
      coordinates: {
        latitude: p.location?.latitude,
        longitude: p.location?.longitude,
      },
      categories: (p.types || []).slice(0, 3).map(t => ({
        alias: t,
        title: t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      })),
    });
  } catch (err) {
    console.error("Error fetching details:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default { getRestaurantDetails };
