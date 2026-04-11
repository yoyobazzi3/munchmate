import { validateChatMessage } from "../utils/validators/chatValidator.js";
import { sendError, sendSuccess } from '../utils/responseHandler.js';
import { buildPrompt, generateChatResponse } from "../services/aiService.js";
// Database queries abstracted to repository layer
import userRepository from "../repositories/userRepository.js";
import chatRepository from "../repositories/chatRepository.js";

/**
 * Controller handling user interactions with the MunchMate AI agent.
 */
const chatbotCtrl = {
  /**
   * Main chat endpoint. 
   * Fetches user food preferences, pieces together context, triggers the LLM generation,
   * and saves the history locally.
   * 
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  chat: async (req, res) => {
    try {
      const { message, location, cuisine, dietary, instruction } = req.body;
      
      // Perform payload validation
      const validation = validateChatMessage(message);
      if (!validation.isValid) {
        return sendError(res, validation.error, 400);
      }

      const userId = req.user.userId;
      
      // Fetch user demographic and long-term food preferences to personalize prompt
      const [prefsRow] = await userRepository.getChatbotPreferences(userId);
      const preferences = prefsRow ?? { liked_foods: '', disliked_foods: '' };
      
      // Combine query and context into standard AI-interpretable prompt
      const prompt = buildPrompt(message, { location, cuisine, dietary, instruction }, preferences);

      // Await LLM response completely isolated in AI service
      const responseText = await generateChatResponse(prompt);

      // Persist the message + AI response so it synchronizes with user's chat history tab
      await chatRepository.saveConversation(userId, message, responseText);

      return sendSuccess(res, { response: responseText });
    } catch (error) {
      console.error("Chatbot Error:", error);
      
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? error.message 
        : "Failed to generate response";
        
      return sendError(res, errorMessage, 500);
    }
  }
};

export default chatbotCtrl;
