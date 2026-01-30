/**
 * MongoDB Connection Usage Examples
 * 
 * This file shows how to use the MongoDB connection in your controllers
 */

import { getCollection, getDB } from './mongodb.js';

// Example 1: Get a collection and perform operations
export const exampleUserOperations = async () => {
  const usersCollection = await getCollection('users');
  
  // Insert a user
  const result = await usersCollection.insertOne({
    email: 'user@example.com',
    passwordHash: 'hashed_password',
    firstName: 'John',
    lastName: 'Doe',
    preferences: {
      favoriteCuisines: [],
      preferredPriceRange: '$$',
      likedFoods: '',
      dislikedFoods: ''
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // Find a user
  const user = await usersCollection.findOne({ email: 'user@example.com' });
  
  // Update a user
  await usersCollection.updateOne(
    { _id: result.insertedId },
    { 
      $set: { 
        'preferences.favoriteCuisines': ['Italian', 'Mexican'],
        updatedAt: new Date()
      } 
    }
  );
  
  return user;
};

// Example 2: Using getDB for more complex operations
export const exampleComplexQuery = async () => {
  const db = await getDB();
  
  // Aggregation example
  const clicks = await db.collection('clicks').aggregate([
    { $match: { userId: 'someUserId' } },
    { $sort: { clickedAt: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'restaurants',
        localField: 'restaurantId',
        foreignField: '_id',
        as: 'restaurant'
      }
    }
  ]).toArray();
  
  return clicks;
};

// Example 3: Transaction (if needed)
export const exampleTransaction = async () => {
  const client = await connectDB();
  const session = client.startSession();
  
  try {
    await session.withTransaction(async () => {
      const usersCollection = await getCollection('users');
      const clicksCollection = await getCollection('clicks');
      
      // Multiple operations in a transaction
      await usersCollection.insertOne({ /* user data */ }, { session });
      await clicksCollection.insertOne({ /* click data */ }, { session });
    });
  } finally {
    await session.endSession();
  }
};
