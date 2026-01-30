import fetch from 'node-fetch';
import { getCollection } from '../config/mongodb.js';
import dotenv from 'dotenv';

dotenv.config();

const YELP_API_KEY = process.env.YELP_API_KEY;
const YELP_API_URL = "https://api.yelp.com/v3/businesses";
const CACHE_DURATION_DAYS = 7; // Cache restaurant data for 7 days

/**
 * Check if restaurant data is fresh (within cache duration)
 */
const isDataFresh = (lastUpdated) => {
  if (!lastUpdated) return false;
  const daysSinceUpdate = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceUpdate < CACHE_DURATION_DAYS;
};

/**
 * Get restaurant from MongoDB cache
 */
export const getRestaurantFromCache = async (restaurantId) => {
  try {
    const restaurantsCollection = await getCollection('restaurants');
    const restaurant = await restaurantsCollection.findOne({ _id: restaurantId });
    
    if (restaurant && isDataFresh(restaurant.lastUpdated)) {
      return restaurant;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting restaurant from cache:', error);
    return null;
  }
};

/**
 * Save restaurant to MongoDB cache
 */
export const saveRestaurantToCache = async (restaurantData) => {
  try {
    const restaurantsCollection = await getCollection('restaurants');
    
    // Transform Yelp API response to our schema
    const restaurant = {
      _id: restaurantData.id,
      name: restaurantData.name,
      address: restaurantData.location?.address1 || "",
      location: {
        latitude: restaurantData.coordinates?.latitude || null,
        longitude: restaurantData.coordinates?.longitude || null,
        address1: restaurantData.location?.address1 || "",
        city: restaurantData.location?.city || "",
        state: restaurantData.location?.state || "",
        zipCode: restaurantData.location?.zip_code || ""
      },
      price: restaurantData.price || null,
      rating: restaurantData.rating || null,
      reviewCount: restaurantData.review_count || null,
      category: restaurantData.categories?.[0]?.title || null,
      categories: restaurantData.categories || [],
      phone: restaurantData.phone || null,
      url: restaurantData.url || null,
      imageUrl: restaurantData.image_url || null,
      photos: restaurantData.photos || [],
      hours: restaurantData.hours || [],
      coordinates: {
        latitude: restaurantData.coordinates?.latitude || null,
        longitude: restaurantData.coordinates?.longitude || null
      },
      lastUpdated: new Date()
    };

    // Upsert (insert or update)
    await restaurantsCollection.updateOne(
      { _id: restaurantData.id },
      { $set: restaurant },
      { upsert: true }
    );

    return restaurant;
  } catch (error) {
    console.error('Error saving restaurant to cache:', error);
    throw error;
  }
};

/**
 * Fetch restaurant from Yelp API (with error handling)
 */
export const fetchRestaurantFromYelp = async (restaurantId) => {
  if (!YELP_API_KEY) {
    throw new Error('YELP_API_KEY is not configured');
  }

  try {
    const response = await fetch(`${YELP_API_URL}/${restaurantId}`, {
      headers: {
        Authorization: `Bearer ${YELP_API_KEY}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Yelp API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching from Yelp:', error);
    throw error;
  }
};

/**
 * Get restaurant details - checks cache first, then Yelp API
 */
export const getRestaurantDetails = async (restaurantId) => {
  // Try cache first
  const cached = await getRestaurantFromCache(restaurantId);
  if (cached) {
    console.log(`✅ Using cached data for restaurant: ${restaurantId}`);
    return cached;
  }

  // If not in cache or stale, fetch from Yelp
  try {
    console.log(`🌐 Fetching from Yelp API: ${restaurantId}`);
    const yelpData = await fetchRestaurantFromYelp(restaurantId);
    
    // Save to cache
    const saved = await saveRestaurantToCache(yelpData);
    return saved;
  } catch (error) {
    // If Yelp API fails, return cached data even if stale
    if (cached) {
      console.log(`⚠️ Yelp API failed, using stale cache: ${restaurantId}`);
      return cached;
    }
    throw error;
  }
};

/**
 * Search restaurants - with caching strategy
 * For search, we'll still need Yelp API but cache individual results
 */
export const searchRestaurants = async (params) => {
  if (!YELP_API_KEY) {
    // If no API key, try to return cached restaurants based on location
    console.log('⚠️ No YELP_API_KEY, attempting to use cached data');
    return await searchCachedRestaurants(params);
  }

  try {
    const searchParams = new URLSearchParams({
      categories: params.category || "restaurants",
      radius: params.radius || 5000,
      sort_by: params.sortBy || "best_match",
      limit: 50,
    });

    if (params.location) searchParams.append("location", params.location);
    if (params.latitude) searchParams.append("latitude", params.latitude);
    if (params.longitude) searchParams.append("longitude", params.longitude);
    if (params.price) searchParams.append("price", params.price);
    if (params.term) searchParams.append("term", params.term);

    const response = await fetch(`${YELP_API_URL}/search?${searchParams.toString()}`, {
      headers: { Authorization: `Bearer ${YELP_API_KEY}` }
    });

    if (!response.ok) {
      const error = await response.json();
      // If API fails, try cached data
      console.log('⚠️ Yelp API failed, trying cached data');
      return await searchCachedRestaurants(params);
    }

    const data = await response.json();
    const businesses = data.businesses || [];

    // Cache all restaurants from search results
    for (const business of businesses) {
      try {
        await saveRestaurantToCache(business);
      } catch (err) {
        console.error(`Error caching restaurant ${business.id}:`, err);
      }
    }

    return businesses;
  } catch (error) {
    console.error('Error searching restaurants:', error);
    // Fallback to cached data
    return await searchCachedRestaurants(params);
  }
};

/**
 * Search cached restaurants by location/coordinates
 */
const searchCachedRestaurants = async (params) => {
  try {
    const restaurantsCollection = await getCollection('restaurants');
    const query = {};

    // Build query based on available params
    if (params.latitude && params.longitude) {
      // Use geospatial query if we have coordinates
      // For now, we'll do a simple range query
      const lat = parseFloat(params.latitude);
      const lng = parseFloat(params.longitude);
      const radius = parseFloat(params.radius || 5000) / 111000; // Convert meters to degrees (roughly)

      query['location.latitude'] = {
        $gte: lat - radius,
        $lte: lat + radius
      };
      query['location.longitude'] = {
        $gte: lng - radius,
        $lte: lng + radius
      };
    }

    if (params.category) {
      query.category = { $regex: params.category, $options: 'i' };
    }

    if (params.price) {
      query.price = params.price;
    }

    // Only return fresh data
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CACHE_DURATION_DAYS);
    query.lastUpdated = { $gte: cutoffDate };

    const restaurants = await restaurantsCollection
      .find(query)
      .limit(50)
      .toArray();

    console.log(`📦 Found ${restaurants.length} cached restaurants`);
    return restaurants;
  } catch (error) {
    console.error('Error searching cached restaurants:', error);
    return [];
  }
};
