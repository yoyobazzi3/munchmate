import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection string - must be set in environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'munchmate';

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is required');
}

let client = null;
let db = null;

/**
 * Connect to MongoDB
 * @returns {Promise<MongoClient>}
 */
export const connectDB = async () => {
  try {
    if (client && client.topology && client.topology.isConnected()) {
      console.log('✅ Using existing MongoDB connection');
      return client;
    }

    // Use the connection string as-is (database name can be in URI or specified separately)
    // Add connection options if not already present
    const connectionString = MONGODB_URI.includes('?') 
      ? MONGODB_URI 
      : `${MONGODB_URI}?retryWrites=true&w=majority`;

    client = new MongoClient(connectionString, {
      // Connection options
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    await client.connect();
    // Database name can be in the connection string or specified here
    db = client.db(DB_NAME);
    
    console.log('✅ Connected to MongoDB');
    
    // Create indexes
    await createIndexes();
    
    return client;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

/**
 * Get database instance
 * @returns {Promise<Db>}
 */
export const getDB = async () => {
  if (!db) {
    await connectDB();
  }
  return db;
};

/**
 * Get a specific collection
 * @param {string} collectionName 
 * @returns {Promise<Collection>}
 */
export const getCollection = async (collectionName) => {
  const database = await getDB();
  return database.collection(collectionName);
};

/**
 * Create indexes for better query performance
 */
const createIndexes = async () => {
  try {
    const database = await getDB();
    
    // Users collection indexes
    const usersCollection = database.collection('users');
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    
    // Clicks collection indexes
    const clicksCollection = database.collection('clicks');
    await clicksCollection.createIndex({ userId: 1, clickedAt: -1 });
    await clicksCollection.createIndex({ restaurantId: 1 });
    await clicksCollection.createIndex({ userId: 1, restaurantId: 1 });
    
    // Chatbot conversations collection indexes
    const conversationsCollection = database.collection('chatbot_conversations');
    await conversationsCollection.createIndex({ userId: 1, timestamp: -1 });
    await conversationsCollection.createIndex({ timestamp: -1 });
    
    // Restaurants collection - using Yelp ID as _id, so no additional index needed
    
    console.log('✅ MongoDB indexes created');
  } catch (error) {
    console.error('⚠️ Error creating indexes (may already exist):', error.message);
  }
};

/**
 * Close MongoDB connection
 */
export const closeDB = async () => {
  if (client) {
    await client.close();
    console.log('✅ MongoDB connection closed');
    client = null;
    db = null;
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDB();
  process.exit(0);
});

export default {
  connectDB,
  getDB,
  getCollection,
  closeDB
};
