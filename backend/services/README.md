# Restaurant Service - Yelp API Caching Solution

## Problem
Yelp API has rate limits and free tier restrictions. API keys expire quickly and subscriptions may not be available.

## Solution
Implemented an aggressive caching strategy that:
1. **Checks MongoDB first** - All restaurant data is cached in MongoDB
2. **Only calls Yelp API when needed** - Only if data is missing or stale (>7 days old)
3. **Graceful fallback** - If Yelp API fails, returns cached data (even if stale)
4. **Automatic caching** - All API responses are automatically saved to MongoDB

## How It Works

### Cache Duration
- Restaurant data is cached for **7 days**
- After 7 days, data is considered stale and will be refreshed from Yelp API

### Flow

#### Getting Restaurant Details
1. Check MongoDB cache first
2. If found and fresh (< 7 days) → return cached data
3. If not found or stale → call Yelp API
4. Save response to MongoDB cache
5. If Yelp API fails → return stale cache (if available)

#### Searching Restaurants
1. Try Yelp API first (for fresh results)
2. Cache all results to MongoDB
3. If Yelp API fails → search MongoDB cache by location/coordinates
4. Return cached results (even if limited)

## Benefits

✅ **Reduced API calls** - Most requests use cached data
✅ **Faster responses** - MongoDB queries are faster than API calls
✅ **Works offline** - Can serve cached data even if Yelp API is down
✅ **Cost effective** - Minimal API usage
✅ **Better UX** - No interruptions when API key expires

## Configuration

Set in `.env`:
```env
YELP_API_KEY=your_key_here  # Optional - app works with cached data if missing
```

## Cache Management

- Cache is automatically updated when:
  - New restaurants are fetched from Yelp
  - Restaurant details are requested
  - Restaurants are saved via `/saveRestaurants`

- To clear cache manually:
  ```javascript
  const restaurantsCollection = await getCollection('restaurants');
  await restaurantsCollection.deleteMany({});
  ```

## Notes

- If `YELP_API_KEY` is not set, the app will only use cached data
- Search results may be limited when using only cached data
- Cache duration can be adjusted in `restaurantService.js` (`CACHE_DURATION_DAYS`)
