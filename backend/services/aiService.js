import Groq from "groq-sdk";

// Initialize the Groq SDK using the environment API key.
// By abstracting this logic here, the controller is not tightly coupled to Groq.
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Constructs a robust contextual prompt for the language model.
 * Injects user location, preferences, and dietary restrictions to ground the AI response.
 *
 * @param {string} message - The core question or message from the user.
 * @param {Object} context - Short-term context like current location, target cuisine, etc.
 * @param {Object} preferences - Long-term preferences from the user's profile (likes/dislikes).
 * @returns {string} The fully composed prompt string.
 */
export const buildPrompt = (message, { location, cuisine, dietary, instruction }, preferences) =>
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

/**
 * Communicates with the AI completion endpoint to generate a text response based on the prompt.
 *
 * @param {string} prompt - The formatted prompt instruction string.
 * @returns {Promise<string>} The generated completion string from the AI model.
 */
export const generateChatResponse = async (prompt) => {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 500,
  });

  return completion.choices[0].message.content;
};
