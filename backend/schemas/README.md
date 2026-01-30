# MongoDB Schemas

This folder contains the schema definitions for the MongoDB database migration from MySQL.

## Collections Overview

### 1. **users** (`userSchema.js`)
- Stores user account information
- **Denormalized**: User preferences are embedded directly in the user document (no separate collection)
- **Indexes**: `email` (unique)

### 2. **restaurants** (`restaurantSchema.js`)
- Stores restaurant data from Yelp API
- Uses Yelp business ID as `_id` (no auto-generated ObjectId)
- Can store full Yelp restaurant details

### 3. **clicks** (`clickSchema.js`)
- Tracks user interactions with restaurants
- **Indexes**: 
  - `userId` + `clickedAt` (for user history queries)
  - `restaurantId` (for popularity queries)
  - `userId` + `restaurantId` (for duplicate prevention)

### 4. **chatbot_conversations** (`chatbotConversationSchema.js`)
- Stores chatbot conversation history
- **Indexes**: `userId` + `timestamp` (for user history queries)

## Migration Strategy

The schemas are designed to be non-relational:
- **No foreign key constraints** (MongoDB doesn't support them)
- **Denormalized data** where it makes sense (user preferences embedded in user document)
- **References stored as ObjectIds or Strings** (not enforced by database)
- **Indexes** for query performance

## Next Steps

1. Install MongoDB driver (`mongodb` or `mongoose`)
2. Create connection configuration
3. Migrate endpoints one at a time:
   - Start with authentication (users collection)
   - Then restaurants
   - Then clicks
   - Finally chatbot conversations
