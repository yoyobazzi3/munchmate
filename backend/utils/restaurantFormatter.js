export const priceToSymbol = (level) => ({
  PRICE_LEVEL_FREE: "$",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
}[level] || null);

export const buildImageUrl = (photoReference, width = 400, backendUrl = '') => {
  if (!photoReference) return null;
  return `${backendUrl}/image-proxy?ref=${encodeURIComponent(photoReference)}&w=${width}`;
};

export const normalizePlaces = (places, backendUrl) =>
  places.map(place => ({
    id: place.id,
    name: place.displayName?.text || "",
    rating: place.rating || 0,
    review_count: place.userRatingCount || 0,
    price: priceToSymbol(place.priceLevel),
    image_url: buildImageUrl(place.photos?.[0]?.name, 400, backendUrl),
    location: {
      address1: place.shortFormattedAddress || place.formattedAddress || "",
    },
    coordinates: {
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
    },
    categories: (place.types || []).slice(0, 2).map(t => ({
      alias: t,
      title: t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    })),
    url: place.googleMapsUri || "",
    dineIn: place.dineIn ?? null,
    takeout: place.takeout ?? null,
    delivery: place.delivery ?? null,
  }));
