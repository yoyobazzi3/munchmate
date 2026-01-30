/**
 * MongoDB Schema Index
 * 
 * Central export point for all database schemas
 */

import userSchema from './userSchema.js';
import restaurantSchema from './restaurantSchema.js';
import clickSchema from './clickSchema.js';
import chatbotConversationSchema from './chatbotConversationSchema.js';

export {
  userSchema,
  restaurantSchema,
  clickSchema,
  chatbotConversationSchema
};

export default {
  userSchema,
  restaurantSchema,
  clickSchema,
  chatbotConversationSchema
};
