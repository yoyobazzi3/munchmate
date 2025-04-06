import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

const getChatHistoryCtrl = {
    /**
     * Retrieves chat history for the authenticated user
     */
    getChatHistory: async (req, res) => {
        try {
            // Get user ID from auth middleware
            const userId = req.user.userId;

            // Get conversation history with metadata
            const [conversations] = await pool.query(
                `SELECT 
                    id,
                    message,
                    response,
                    UNIX_TIMESTAMP(timestamp) as timestamp,
                    DATE_FORMAT(timestamp, '%W, %M %e %Y at %l:%i %p') as formatted_date
                FROM chatbot_conversations 
                WHERE userID = ? 
                ORDER BY timestamp DESC
                LIMIT 50`,  // Limit to recent 50 messages
                [userId]
            );

            // Group messages by session (day)
            const sessions = {};
            conversations.forEach(conv => {
                const dateKey = new Date(conv.timestamp * 1000).toDateString();
                if (!sessions[dateKey]) {
                    sessions[dateKey] = {
                        date: conv.formatted_date,
                        conversations: []
                    };
                }
                sessions[dateKey].conversations.push({
                    id: conv.id,
                    userMessage: conv.message,
                    botResponse: conv.response,
                    timestamp: conv.timestamp
                });
            });

            return res.status(200).json({
                success: true,
                data: {
                    total: conversations.length,
                    sessions: Object.values(sessions)
                }
            });

        } catch (error) {
            console.error("Chat History Error:", error);
            return res.status(500).json({ 
                success: false,
                error: "Failed to retrieve chat history",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    /**
     * Clears chat history for a user
     */
    clearHistory: async (req, res) => {
        try {
            // Get user ID from auth middleware
            const userId = req.user.userId;

            await pool.query(
                "DELETE FROM chatbot_conversations WHERE userID = ?",
                [userId]
            );

            return res.status(200).json({
                success: true,
                message: "Chat history cleared successfully"
            });

        } catch (error) {
            console.error("Clear History Error:", error);
            return res.status(500).json({ 
                success: false,
                error: "Failed to clear chat history",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

export default getChatHistoryCtrl;