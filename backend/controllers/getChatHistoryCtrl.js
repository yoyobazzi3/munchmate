// All database queries are abstracted into the repository layer
import chatRepository from '../repositories/chatRepository.js';

const getChatHistoryCtrl = {
    /**
     * Retrieves chat history for the authenticated user
     */
    getChatHistory: async (req, res) => {
        try {
            // Get user ID from auth middleware
            const userId = req.user.userId;

            // Fetch the 50 most recent conversations via the chat repository
            const [conversations] = await chatRepository.getHistory(userId);

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

            // Delete all conversations via the chat repository
            await chatRepository.clearHistory(userId);

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
