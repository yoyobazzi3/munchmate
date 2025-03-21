import { exec } from 'child_process';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

const getChatHistoryCtrl = {
    getChatHistory: async (req, res) => {
        try {
          const token = req.headers.authorization?.split(" ")[1]; // Extract token
          if (!token) return res.status(401).json({ error: "Unauthorized" });
    
          let userId;
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.id;
          } catch (error) {
            return res.status(401).json({ error: "Invalid or expired token" });
          }
    
          const [history] = await pool.query(
            "SELECT message, response FROM chatbot_conversations WHERE userID = ? ORDER BY timestamp ASC",
            [userId]
          );
    
          res.json(history);
        } catch (error) {
          console.error("Error fetching chat history:", error);
          res.status(500).json({ error: "Internal server error" });
        }
      }
    };
export default getChatHistoryCtrl;    