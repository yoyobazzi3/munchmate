/**
 * Click Tracking Schema for MongoDB
 * 
 * Tracks user interactions with restaurants (clicks/views)
 */

const clickSchema = {
  // Click identification
  _id: "ObjectId (auto-generated)",
  
  // References (using ObjectId for user, String for restaurant Yelp ID)
  userId: "ObjectId (reference to users._id, indexed)",
  restaurantId: "String (Yelp business ID, indexed)",
  
  // Optional: item type for future extensibility
  itemType: "String (default: 'restaurant')",
  
  // Timestamp
  clickedAt: "Date (default: Date.now, indexed)"
};

/**
 * Indexes:
 * - { userId: 1, clickedAt: -1 } - for user click history queries
 * - { restaurantId: 1 } - for restaurant popularity queries
 * - { userId: 1, restaurantId: 1 } - for duplicate click prevention
 */

/**
 * Example document:
 * {
 *   _id: ObjectId("507f1f77bcf86cd799439012"),
 *   userId: ObjectId("507f1f77bcf86cd799439011"),
 *   restaurantId: "yelp-restaurant-id-123",
 *   itemType: "restaurant",
 *   clickedAt: ISODate("2024-01-15T10:30:00Z")
 * }
 */

export default clickSchema;
