import { spawn } from 'child_process';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

const chatbotCtrl = {
  /**
   * Handles chatbot interaction
   */
  chat: async (req, res) => {
    try {
      const { token, message } = req.body;
      if (!token || !message) {
        return res.status(400).json({ error: "Token and message are required" });
      }

      let userId;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      const [userPrefs] = await pool.query(
        "SELECT liked_foods, disliked_foods FROM user_preferences WHERE userID = ?",
        [userId]
      );

      const preferences = userPrefs[0] || { liked_foods: '', disliked_foods: '' };
      const prompt = `User likes: ${preferences.liked_foods}, dislikes: ${preferences.disliked_foods}. ${message}`;

      // Use Ollama to generate a response
      const ollamaProcess = spawn("ollama", ["run", "mistral"], { stdio: ["pipe", "pipe", "ignore"] });

      let responseText = "";

      ollamaProcess.stdin.write(prompt + "\n");
      ollamaProcess.stdin.end();

      ollamaProcess.stdout.on("data", (data) => {
        responseText += data.toString();
      });

      ollamaProcess.stdout.on("end", async () => {
        // Save the conversation to the database
        await pool.query(
          "INSERT INTO chatbot_conversations (userID, message, response) VALUES (?, ?, ?)",
          [userId, message, responseText.trim()]
        );

        // Send the complete response to the frontend
        res.json({ response: responseText.trim() });
      });

    } catch (error) {
      console.error("Chatbot Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  ask: async (req, res) => {
    try {
      const { token, message } = req.body;
      if (!token || !message) {
        return res.status(400).json({ error: "Token and message are required" });
      }

      let userId;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      const [userPrefs] = await pool.query(
        "SELECT liked_foods, disliked_foods FROM user_preferences WHERE userID = ?",
        [userId]
      );

      const preferences = userPrefs[0] || { liked_foods: '', disliked_foods: '' };
      const prompt = `User likes: ${preferences.liked_foods}, dislikes: ${preferences.disliked_foods}. ${message}`;

      // Use Ollama to generate a response
      const ollamaProcess = spawn("ollama", ["run", "mistral"], { stdio: ["pipe", "pipe", "ignore"] });

      let responseText = "";

      ollamaProcess.stdin.write(prompt + "\n");
      ollamaProcess.stdin.end();

      ollamaProcess.stdout.on("data", (data) => {
        responseText += data.toString();
      });

      ollamaProcess.stdout.on("end", async () => {
        // Save the conversation to the database
        await pool.query(
          "INSERT INTO chatbot_conversations (userID, message, response) VALUES (?, ?, ?)",
          [userId, message, responseText.trim()]
        );

        // Send the complete response to the frontend
        res.json({ response: responseText.trim() });
      });

    } catch (error) {
      console.error("Chatbot Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },


    /**
   * Handles streaming chatbot interaction
   */
    // streamChat: async (req, res) => {
    //   try {
    //     const { token, message } = req.query;
    //     if (!token || !message) {
    //       return res.status(400).json({ error: "Token and message are required" });
    //     }
  
    //     let userId;
    //     try {
    //       const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //       userId = decoded.id;
    //     } catch (error) {
    //       return res.status(401).json({ error: "Invalid or expired token" });
    //     }
  
    //     const [userPrefs] = await pool.query(
    //       "SELECT liked_foods, disliked_foods FROM user_preferences WHERE userID = ?",
    //       [userId]
    //     );
  
    //     const preferences = userPrefs[0] || { liked_foods: '', disliked_foods: '' };
    //     const prompt = `User likes: ${preferences.liked_foods}, dislikes: ${preferences.disliked_foods}. ${message}`;
  
    //     res.setHeader("Content-Type", "text/event-stream");
    //     res.setHeader("Cache-Control", "no-cache");
    //     res.setHeader("Connection", "keep-alive");
  
    //     const ollamaProcess = spawn("ollama", ["run", "mistral"], { stdio: ["pipe", "pipe", "ignore"] });
  
    //     ollamaProcess.stdin.write(prompt + "\n");
    //     ollamaProcess.stdin.end();
  
    //     let responseText = "";
    //     let sentenceBuffer = "";
  
    //     ollamaProcess.stdout.on("data", (data) => {
    //       let chunk = data.toString().trim();
          
    //       // ✅ Append only new chunks to the response
    //       if (chunk && !responseText.includes(chunk)) {
    //         responseText += chunk + " ";
    //         res.write(`data: ${chunk}\n\n`);
    //       }
    //     });
  
    //     ollamaProcess.stdout.on("end", async () => {
    //       await pool.query(
    //         "INSERT INTO chatbot_conversations (userID, message, response) VALUES (?, ?, ?)",
    //         [userId, message, responseText.trim()]
    //       );
    //       res.write(`event: end\ndata: end\n\n`);
    //       res.end();
    //     });
  
    //   } catch (error) {
    //     console.error("Chatbot Streaming Error:", error);
    //     res.status(500).json({ error: "Internal server error" });
    //   }
    // }
    
};

export default chatbotCtrl;