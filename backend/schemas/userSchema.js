/**
 * User Schema for MongoDB
 * 
 * This schema combines user data with preferences (denormalized for non-relational design)
 */

const userSchema = {
  // User identification
  _id: "ObjectId (auto-generated)",
  email: "String (required, unique, indexed)",
  passwordHash: "String (required)",
  
  // User profile
  firstName: "String (required)",
  lastName: "String (required)",
  
  // Embedded preferences (denormalized from separate user_preferences table)
  preferences: {
    favoriteCuisines: "Array of Strings (default: [])",
    preferredPriceRange: "String (default: '$$')",
    likedFoods: "String (default: '')",
    dislikedFoods: "String (default: '')"
  },
  
  // Timestamps
  createdAt: "Date (default: Date.now)",
  updatedAt: "Date (default: Date.now)"
};

/**
 * Example document:
 * {
 *   _id: ObjectId("507f1f77bcf86cd799439011"),
 *   email: "user@example.com",
 *   passwordHash: "$2a$10$...",
 *   firstName: "John",
 *   lastName: "Doe",
 *   preferences: {
 *     favoriteCuisines: ["Italian", "Mexican"],
 *     preferredPriceRange: "$$",
 *     likedFoods: "Pizza, Tacos",
 *     dislikedFoods: "Seafood"
 *   },
 *   createdAt: ISODate("2024-01-15T10:30:00Z"),
 *   updatedAt: ISODate("2024-01-15T10:30:00Z")
 * }
 */

export default userSchema;
