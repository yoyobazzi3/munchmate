/**
 * Groups raw chat completely into distinct sessions by date.
 * Formats the response to be easily consumed by the frontend history tab.
 * 
 * @param {Array} conversations - Flat array of conversation records from the database.
 * @returns {Array} An array of session objects, each containing an array of conversations for that day.
 */
export const groupConversationsBySession = (conversations) => {
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

  return Object.values(sessions);
};
