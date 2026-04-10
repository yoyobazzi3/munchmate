import Groq from "groq-sdk";
import dotenv from "dotenv";
import pool from "../config/db.js";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

      if (message.length > 500) {
        return res.status(400).json({
          success: false,
          error: "Message must be 500 characters or fewer"
        });
      }

      // Use user ID from the auth middleware
      const userId = req.user.userId;

      // Get user preferences
      let preferences = { liked_foods: '', disliked_foods: '' };

      try {
        const [userPrefs] = await pool.query(
          "SELECT liked_foods, disliked_foods FROM user_preferences WHERE user_id = ?",
          [userId]
        );

        if (userPrefs && userPrefs.length > 0) {
          preferences = userPrefs[0];
        }
      } catch (dbError) {
        console.error("Database error when fetching preferences:", dbError);
        // Continue with empty preferences
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

      // Generate response
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      });

      const responseText = completion.choices[0].message.content;

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

      if (message.length > 500) {
        return res.status(400).json({
          success: false,
          error: "Message must be 500 characters or fewer"
        });
      }

      // Use user ID from the auth middleware
      const userId = req.user.userId;

      // Get user preferences (with error handling)
      let preferences = { liked_foods: '', disliked_foods: '' };

      try {
        const [userPrefs] = await pool.query(
          "SELECT liked_foods, disliked_foods FROM user_preferences WHERE user_id = ?",
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
        let fullResponse = "";

        // Generate and stream response
        const stream = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 500,
          stream: true,
        });

        for await (const chunk of stream) {
          const chunkText = chunk.choices[0]?.delta?.content || "";
          fullResponse += chunkText;
          if (chunkText) res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }

        // Save complete conversation
        await pool.query(
          "INSERT INTO chatbot_conversations (userID, message, response) VALUES (?, ?, ?)",
          [userId, message, fullResponse]
        );

        res.write("event: end\ndata: end\n\n");
      } catch (apiError) {
        console.error("Groq API Error:", apiError);
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
