/**
 * Restaurant Schema for MongoDB
 * 
 * Stores restaurant data from Yelp API
 */

const restaurantSchema = {
  // Restaurant identification (Yelp ID)
  _id: "String (Yelp business ID, used as _id)",
  
  // Basic info
  name: "String (required)",
  address: "String",
  
  // Location
  location: {
    latitude: "Number",
    longitude: "Number",
    address1: "String",
    city: "String",
    state: "String",
    zipCode: "String"
  },
  
  // Pricing and ratings
  price: "String (e.g., '$', '$$', '$$$', '$$$$')",
  rating: "Number (0-5)",
  reviewCount: "Number",
  
  // Categories
  category: "String (primary category)",
  categories: "Array of Objects [{alias: String, title: String}]",
  
  // Additional Yelp data (can be stored for full details)
  phone: "String",
  url: "String (Yelp URL)",
  imageUrl: "String",
  photos: "Array of Strings (photo URLs)",
  hours: "Array of Objects (opening hours)",
  coordinates: {
    latitude: "Number",
    longitude: "Number"
  },
  
  // Metadata
  lastUpdated: "Date (default: Date.now)"
};

/**
 * Example document:
 * {
 *   _id: "yelp-restaurant-id-123",
 *   name: "Joe's Pizza",
 *   address: "123 Main St",
 *   location: {
 *     latitude: 40.7128,
 *     longitude: -74.0060,
 *     address1: "123 Main St",
 *     city: "New York",
 *     state: "NY",
 *     zipCode: "10001"
 *   },
 *   price: "$$",
 *   rating: 4.5,
 *   reviewCount: 250,
 *   category: "Pizza",
 *   categories: [
 *     { alias: "pizza", title: "Pizza" },
 *     { alias: "italian", title: "Italian" }
 *   ],
 *   phone: "+1234567890",
 *   url: "https://www.yelp.com/biz/joes-pizza",
 *   imageUrl: "https://...",
 *   photos: ["https://...", "https://..."],
 *   coordinates: {
 *     latitude: 40.7128,
 *     longitude: -74.0060
 *   },
 *   lastUpdated: ISODate("2024-01-15T10:30:00Z")
 * }
 */

export default restaurantSchema;
