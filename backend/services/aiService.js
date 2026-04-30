import Groq from "groq-sdk";

// Lazy singleton — defers construction until first use so the module can be
// imported safely before dotenv or Cloud Run env vars are fully resolved.
let _groq;
const groq = () => {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
};

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
  const completion = await groq().chat.completions.create({
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

  const completion = await groq().chat.completions.create({
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
 * Generates a 2-sentence taste profile summary from a user's rated restaurant history.
 *
 * @param {Array<{name: string, category: string, rating: number}>} ratedFavorites
 * @returns {Promise<string|null>} A taste profile summary, or null if no ratings exist.
 */
export const generateInsightFromRatings = async (ratedFavorites) => {
  if (!ratedFavorites.length) return null;

  const list = ratedFavorites
    .map(r => `- ${r.name} (${r.category || 'restaurant'}): ${r.rating}/5`)
    .join('\n');

  const completion = await groq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          'You are a food personality analyst. Based on the user\'s restaurant ratings, write exactly 2 sentences summarizing their taste profile. Be specific about cuisine types, price styles, and patterns. Example: "You tend to love casual Asian spots and budget-friendly taquerias. You consistently rate fine dining Italian and upscale steakhouses poorly."',
      },
      { role: "user", content: `My restaurant ratings:\n${list}` },
    ],
    temperature: 0.5,
    max_tokens: 120,
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
  const completion = await groq().chat.completions.create({
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

/**
 * Generates a 2-sentence spending summary + a money-saving suggestion.
 *
 * @param {{ total: number, avgPerMeal: number, topCategory: string, mealCount: number }} spendData
 * @returns {Promise<string>} A short spending insight string.
 */
export const generateSpendingSummary = async ({ total, avgPerMeal, topCategory, mealCount }) => {
  const prompt = `The user has logged ${mealCount} dining expense${mealCount !== 1 ? 's' : ''} totalling $${total.toFixed(2)} (avg $${avgPerMeal.toFixed(2)} per meal). Their top spending category is "${topCategory}". Write exactly 2 sentences: first summarize their dining spend, then suggest a budget-friendly way to keep enjoying that cuisine. Be specific and encouraging.`;

  const completion = await groq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "You are a friendly personal finance assistant specializing in dining. Be concise and practical." },
      { role: "user", content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 120,
  });

  return completion.choices[0].message.content;
};
