/**
 * Chatbot Conversation Schema for MongoDB
 * 
 * Stores chatbot conversations between users and the AI assistant
 */

const chatbotConversationSchema = {
  // Conversation identification
  _id: "ObjectId (auto-generated)",
  
  // User reference
  userId: "ObjectId (reference to users._id, indexed)",
  
  // Conversation data
  message: "String (required, user's message)",
  response: "String (required, bot's response)",
  
  // Optional context for better recommendations
  context: {
    location: "String",
    cuisine: "String",
    dietary: "String",
    instruction: "String"
  },
  
  // Timestamp
  timestamp: "Date (default: Date.now, indexed)"
};

/**
 * Indexes:
 * - { userId: 1, timestamp: -1 } - for user chat history queries (most recent first)
 * - { timestamp: -1 } - for general conversation queries
 */

/**
 * Example document:
 * {
 *   _id: ObjectId("507f1f77bcf86cd799439013"),
 *   userId: ObjectId("507f1f77bcf86cd799439011"),
 *   message: "Find me a good pizza place",
 *   response: "I recommend Joe's Pizza on Main St...",
 *   context: {
 *     location: "New York, NY",
 *     cuisine: "Italian",
 *     dietary: "",
 *     instruction: "focus on restaurant recommendations only"
 *   },
 *   timestamp: ISODate("2024-01-15T10:30:00Z")
 * }
 */

export default chatbotConversationSchema;
