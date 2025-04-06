import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import pool from "../config/db.js";

dotenv.config();

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

      // Get user preferences
      let preferences = { liked_foods: '', disliked_foods: '' };
      
      try {
        const [userPrefs] = await pool.query(
          "SELECT liked_foods, disliked_foods FROM user_preferences WHERE userID = ?",
          [userId]
        );
        
        if (userPrefs && userPrefs.length > 0) {
          preferences = userPrefs[0];
        }
      } catch (dbError) {
        console.error("Database error when fetching preferences:", dbError);
        // Continue with empty preferences
      }

      // Get user's restaurant history for better recommendations
      let restaurantHistory = [];
      try {
        const [history] = await pool.query(
          `SELECT r.name, r.cuisine, r.location, COUNT(*) as visit_count
           FROM click_tracking ct
           JOIN restaurants r ON ct.item_id = r.id
           WHERE ct.userID = ? AND ct.item_type = 'restaurant'
           GROUP BY r.id
           ORDER BY visit_count DESC
           LIMIT 5`,
          [userId]
        );
        restaurantHistory = history;
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
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 500, // Keep responses shorter
        }
      });
      
      const response = await result.response;
      const responseText = response.text();

      // Save conversation to database
      await pool.query(
        "INSERT INTO chatbot_conversations (userID, message, response) VALUES (?, ?, ?)",
        [userId, message, responseText]
      );

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

      // Get user preferences (with error handling)
      let preferences = { liked_foods: '', disliked_foods: '' };
      
      try {
        const [userPrefs] = await pool.query(
          "SELECT liked_foods, disliked_foods FROM user_preferences WHERE userID = ?",
          [userId]
        );
        
        if (userPrefs && userPrefs.length > 0) {
          preferences = userPrefs[0];
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

      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        let fullResponse = "";

        // Generate and stream response
        const result = await model.generateContentStream({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 500, // Keep responses shorter
          }
        });
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullResponse += chunkText;
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }

        // Save complete conversation
        await pool.query(
          "INSERT INTO chatbot_conversations (userID, message, response) VALUES (?, ?, ?)",
          [userId, message, fullResponse]
        );

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