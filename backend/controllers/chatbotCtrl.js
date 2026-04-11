import Groq from "groq-sdk";
import { validateChatMessage } from "../utils/validators.js";
// All database queries are abstracted into the repository layer
import userRepository from "../repositories/userRepository.js";
import chatRepository from "../repositories/chatRepository.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const buildPrompt = (message, { location, cuisine, dietary, instruction }, preferences) =>
  `You are MunchMate, a helpful restaurant recommendation assistant.

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

const chatbotCtrl = {
  chat: async (req, res) => {
    try {
      const { message, location, cuisine, dietary, instruction } = req.body;
      const validation = validateChatMessage(message);
      if (!validation.isValid) {
        return res.status(400).json({ success: false, error: validation.error });
      }

      const userId = req.user.userId;
      // Fetch user food preferences to personalize the AI prompt
      const [prefsRow] = await userRepository.getChatbotPreferences(userId);
      const preferences = prefsRow ?? { liked_foods: '', disliked_foods: '' };
      const prompt = buildPrompt(message, { location, cuisine, dietary, instruction }, preferences);

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      });

      const responseText = completion.choices[0].message.content;

      // Persist the message + AI response so it appears in chat history
      await chatRepository.saveConversation(userId, message, responseText);

      return res.status(200).json({ success: true, response: responseText });
    } catch (error) {
      console.error("Chatbot Error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to generate response",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

export default chatbotCtrl;
