// All database queries are abstracted into the repository layer
import chatRepository from '../repositories/chatRepository.js';
import { sendError, sendSuccess } from '../utils/responseHandler.js';
import { groupConversationsBySession } from '../utils/chatFormatter.js';

/**
 * Controller to handle retrieving and clearing the AI chatbot history.
 */
const getChatHistoryCtrl = {
    /**
     * Retrieves chat history for the authenticated user up to the last 50 entries.
     * Aggregates the conversations intuitively by day.
     * 
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    getChatHistory: async (req, res) => {
        try {
            // Decoded user ID from auth middleware
            const userId = req.user.userId;

            // Fetch the 50 most recent conversations via the chat repository
            const conversations = await chatRepository.getHistory(userId);

            // Group messages cleanly into daily sessions using the abstracted formatter
            const structuredSessions = groupConversationsBySession(conversations);

            return sendSuccess(res, {
                total: conversations.length,
                sessions: structuredSessions,
            });
        } catch (error) {
            console.error("Chat History Error:", error);
            const errorMessage = process.env.NODE_ENV === 'development' 
                ? error.message 
                : "Failed to retrieve chat history";
            return sendError(res, errorMessage, 500);
        }
    },

    /**
     * Clears all persisted chat occurrences for the user.
     * 
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    clearHistory: async (req, res) => {
        try {
            // Decoded user ID from auth middleware
            const userId = req.user.userId;

            // Delete all conversations related to this user ID permanently
            await chatRepository.clearHistory(userId);

            return sendSuccess(res, { message: "Chat history cleared successfully." });
        } catch (error) {
            console.error("Clear History Error:", error);
            const errorMessage = process.env.NODE_ENV === 'development' 
                ? error.message 
                : "Failed to clear chat history";
            return sendError(res, errorMessage, 500);
        }
    }
};

export default getChatHistoryCtrl;
