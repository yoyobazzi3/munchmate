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

/**
 * Uses the AI to produce a 2-sentence vibe summary from an array of Google Places reviews.
 *
 * @param {Array<Object>} reviews - Raw review objects from Google Places API.
 * @returns {Promise<string>} A concise vibe summary string.
 */
export const summarizeReviews = async (reviews) => {
  const reviewText = reviews
    .map((r, i) => `Review ${i + 1}: "${r.text?.text || r.originalText?.text || ''}"`)
    .filter((r) => r.length > 15)
    .join("\n");

  if (!reviewText) return null;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a concise restaurant critic. Summarize the following reviews in exactly 2 sentences capturing the overall vibe, best use case, and any notable caveats. Be direct and specific.",
      },
      { role: "user", content: reviewText },
    ],
    temperature: 0.5,
    max_tokens: 100,
  });

  return completion.choices[0].message.content;
};

/**
 * Extracts food preferences (liked/disliked items) from a user's chat message.
 *
 * @param {string} userMessage - The raw user message.
 * @returns {Promise<{liked: string[], disliked: string[]}>}
 */
export const extractPreferences = async (userMessage) => {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          'Extract food preferences from the user message. Return ONLY valid JSON with this shape: {"liked": [], "disliked": []}. Use short food item strings. Return empty arrays if no preferences are expressed.',
      },
      { role: "user", content: userMessage },
    ],
    temperature: 0,
    max_tokens: 100,
  });

  try {
    const raw = completion.choices[0].message.content.trim();
    // Strip markdown code fences if present
    const json = raw.replace(/^```json?\s*/i, "").replace(/```$/, "").trim();
    return JSON.parse(json);
  } catch {
    return { liked: [], disliked: [] };
  }
};
