import dotenv from 'dotenv';
import { getCollection } from '../config/mongodb.js';
import { ObjectId } from 'mongodb';

dotenv.config();

// Format date helper
const formatDate = (date) => {
  const d = new Date(date);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const day = days[d.getDay()];
  const month = months[d.getMonth()];
  const dateNum = d.getDate();
  const hours = d.getHours() % 12 || 12;
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
  
  return `${day}, ${month} ${dateNum} ${d.getFullYear()} at ${hours}:${minutes} ${ampm}`;
};

const getChatHistoryCtrl = {
    /**
     * Retrieves chat history for the authenticated user
     */
    getChatHistory: async (req, res) => {
        try {
            // Get user ID from auth middleware
            const userId = req.user.userId;
            const userIdObj = new ObjectId(userId);

            // Get conversation history from MongoDB
            const conversationsCollection = await getCollection('chatbot_conversations');
            const conversations = await conversationsCollection
                .find({ userId: userIdObj })
                .sort({ timestamp: -1 })
                .limit(50)
                .toArray();

            // Group messages by session (day)
            const sessions = {};
            conversations.forEach(conv => {
                const dateKey = new Date(conv.timestamp).toDateString();
                if (!sessions[dateKey]) {
                    sessions[dateKey] = {
                        date: formatDate(conv.timestamp),
                        conversations: []
                    };
                }
                sessions[dateKey].conversations.push({
                    id: conv._id.toString(),
                    userMessage: conv.message,
                    botResponse: conv.response,
                    timestamp: Math.floor(new Date(conv.timestamp).getTime() / 1000)
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
            const userIdObj = new ObjectId(userId);

            const conversationsCollection = await getCollection('chatbot_conversations');
            await conversationsCollection.deleteMany({ userId: userIdObj });

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