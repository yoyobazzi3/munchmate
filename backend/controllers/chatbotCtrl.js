import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { getCollection } from "../config/mongodb.js";
import { ObjectId } from "mongodb";

dotenv.config();

// Initialize Google Generative AI with API key
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const chatbotCtrl = {
  /**
   * Handles regular chatbot interaction
   */
  chat: async (req, res) => {
    try {
      const { message, location, cuisine, dietary, instruction } = req.body;
      
      if (!message) {
        return res.status(400).json({ 
          success: false,
          error: "Message is required" 
        });
      }

      // Use user ID from the auth middleware
      const userId = req.user.userId;
      const userIdObj = new ObjectId(userId);

      // Get user preferences from MongoDB
      let preferences = { liked_foods: '', disliked_foods: '' };
      
      try {
        const usersCollection = await getCollection('users');
        const user = await usersCollection.findOne({ _id: userIdObj });
        
        if (user && user.preferences) {
          preferences = {
            liked_foods: user.preferences.likedFoods || '',
            disliked_foods: user.preferences.dislikedFoods || ''
          };
        }
      } catch (dbError) {
        console.error("Database error when fetching preferences:", dbError);
        // Continue with empty preferences
      }

      // Get user's restaurant history for better recommendations
      let restaurantHistory = [];
      try {
        const clicksCollection = await getCollection('clicks');
        const restaurantsCollection = await getCollection('restaurants');
        
        // Get user's click history
        const clicks = await clicksCollection
          .find({ userId: userIdObj, itemType: 'restaurant' })
          .sort({ clickedAt: -1 })
          .limit(10)
          .toArray();
        
        // Get restaurant details for clicked restaurants
        const restaurantIds = clicks.map(click => click.restaurantId);
        if (restaurantIds.length > 0) {
          const restaurants = await restaurantsCollection
            .find({ _id: { $in: restaurantIds } })
            .toArray();
          
          // Group by restaurant and count visits
          const visitCounts = {};
          clicks.forEach(click => {
            visitCounts[click.restaurantId] = (visitCounts[click.restaurantId] || 0) + 1;
          });
          
          restaurantHistory = restaurants
            .map(r => ({
              name: r.name,
              cuisine: r.category,
              location: r.location?.city || '',
              visit_count: visitCounts[r._id] || 0
            }))
            .sort((a, b) => b.visit_count - a.visit_count)
            .slice(0, 5);
        }
      } catch (historyErr) {
        console.error("Error fetching restaurant history:", historyErr);
      }
      
      // Create the prompt with context - focused on restaurant recommendations
      const prompt = `You are MunchMate, a helpful restaurant recommendation assistant.

IMPORTANT INSTRUCTIONS:
- ONLY recommend restaurants, never recipes or cooking instructions
- Keep your responses brief and to the point (1-3 sentences max unless listing specific restaurants)
- Focus on specific restaurant suggestions when possible
- If asked about a food item, recommend restaurants that serve it well

User context:
- Location: ${location || 'not specified'}
- Cuisine interest: ${cuisine || 'not specified'}
- Dietary needs: ${dietary || 'not specified'}
- Likes: ${preferences.liked_foods || 'not specified'}
- Dislikes: ${preferences.disliked_foods || 'not specified'}
${restaurantHistory.length > 0 ? 
  `- Previously visited restaurants: ${restaurantHistory.map(r => r.name).join(', ')}` : 
  ''}

${instruction ? `Special instruction: ${instruction}` : ''}

User query: "${message}"`;

      // Generate response
      if (!genAI) {
        return res.status(503).json({
          success: false,
          error: "AI service is not configured. Please set GEMINI_API_KEY in environment variables."
        });
      }

      let responseText = "";
      
      try {
        const model = genAI.getGenerativeModel({
          model: "models/gemini-flash-latest",
        });

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 500,
          },
        });

        responseText = result.response.text();
      } catch (apiError) {
        console.error("Gemini API Error:", apiError);
        // Return a helpful error message
        return res.status(503).json({
          success: false,
          error: "AI service is currently unavailable. Please try again later.",
          details: process.env.NODE_ENV === 'development' ? apiError.message : undefined
        });
      }

      // Save conversation to MongoDB
      try {
        const conversationsCollection = await getCollection('chatbot_conversations');
        await conversationsCollection.insertOne({
          userId: userIdObj,
          message: message,
          response: responseText,
          context: {
            location: location || '',
            cuisine: cuisine || '',
            dietary: dietary || '',
            instruction: instruction || ''
          },
          timestamp: new Date()
        });
      } catch (dbError) {
        console.error("Error saving conversation:", dbError);
        // Continue even if save fails
      }

      return res.status(200).json({
        success: true,
        response: responseText
      });

    } catch (error) {
      console.error("Chatbot Error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to generate response",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Handles streaming chatbot interaction (SSE)
   */
  streamChat: async (req, res) => {
    try {
      const { message, location, cuisine, dietary, instruction } = req.query;
      
      if (!message) {
        return res.status(400).json({ 
          success: false,
          error: "Message is required" 
        });
      }

      // Use user ID from the auth middleware
      const userId = req.user.userId;
      const userIdObj = new ObjectId(userId);

      // Get user preferences from MongoDB
      let preferences = { liked_foods: '', disliked_foods: '' };
      
      try {
        const usersCollection = await getCollection('users');
        const user = await usersCollection.findOne({ _id: userIdObj });
        
        if (user && user.preferences) {
          preferences = {
            liked_foods: user.preferences.likedFoods || '',
            disliked_foods: user.preferences.dislikedFoods || ''
          };
        }
      } catch (dbError) {
        console.error("Database error when fetching preferences:", dbError);
      }
      
      // Create the prompt with context - focused on restaurant recommendations
      const prompt = `You are MunchMate, a helpful restaurant recommendation assistant.

IMPORTANT INSTRUCTIONS:
- ONLY recommend restaurants, never recipes or cooking instructions
- Keep your responses brief and to the point (1-3 sentences max unless listing specific restaurants)
- Focus on specific restaurant suggestions when possible
- If asked about a food item, recommend restaurants that serve it well

User context:
- Location: ${location || 'not specified'}
- Cuisine interest: ${cuisine || 'not specified'}
- Dietary needs: ${dietary || 'not specified'}
- Likes: ${preferences.liked_foods || 'not specified'}
- Dislikes: ${preferences.disliked_foods || 'not specified'}

${instruction ? `Special instruction: ${instruction}` : ''}

User query: "${message}"`;

      // Set up SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      if (!genAI) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: "AI service is not configured" })}\n\n`);
        res.end();
        return;
      }

      try {
        const model = genAI.getGenerativeModel({
          model: "models/gemini-flash-latest",
        });
        
        let fullResponse = "";

        // Generate and stream response
        const result = await model.generateContentStream({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 500,
          }
        });
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullResponse += chunkText;
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }

        // Save complete conversation to MongoDB
        try {
          const conversationsCollection = await getCollection('chatbot_conversations');
          await conversationsCollection.insertOne({
            userId: userIdObj,
            message: message,
            response: fullResponse,
            context: {
              location: location || '',
              cuisine: cuisine || '',
              dietary: dietary || '',
              instruction: instruction || ''
            },
            timestamp: new Date()
          });
        } catch (dbError) {
          console.error("Error saving conversation:", dbError);
        }

        res.write("event: end\ndata: end\n\n");
      } catch (apiError) {
        console.error("Gemini API Error:", apiError);
        res.write(`event: error\ndata: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
      }
      
      res.end();

    } catch (error) {
      console.error("Streaming Error:", error);
      try {
        res.write(`event: error\ndata: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
        res.end();
      } catch (responseError) {
        console.error("Error sending error response:", responseError);
      }
    }
  }
};

export default chatbotCtrl;