import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../utils/jwtUtils.js';
import { sendError, sendSuccess } from '../utils/responseHandler.js';
// All database queries are abstracted into the repository layer
import userRepository from '../repositories/userRepository.js';

const authCtrl = {
  signup: async (req, res) => {
    try {
      const { firstName, lastName, email, password, favoriteCuisines, priceRange } = req.body;
      if (!firstName || !lastName || !email || !password) {
        return sendError(res, "First name, last name, email, and password are required.", 400);
      }

      if (password.length < 8) {
        return sendError(res, "Password must be at least 8 characters.", 400);
      }

      if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        return sendError(res, "Password must contain at least one uppercase letter and one number.", 400);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      // Create user then create their default preferences row
      const result = await userRepository.createUser(firstName, lastName, email, hashedPassword);
      await userRepository.createPreferences(
        result.insertId,
        JSON.stringify(favoriteCuisines || []),
        priceRange || '$$'
      );

      sendSuccess(res, { message: "Signup successful! Please log in." }, 201);
    } catch (error) {
      sendError(res);
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const users = await userRepository.findByEmail(email);

      if (!users.length || !(await bcrypt.compare(password, users[0].password_hash))) {
        return sendError(res, "Invalid email or password.", 401);
      }

      const user = users[0];
      const token = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user.id);

      sendSuccess(res, { token, refreshToken, message: "Login successful!", user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email } });
    } catch (error) {
      sendError(res);
    }
  },

  refresh: async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendError(res, "Refresh token required.", 401);

    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      const users = await userRepository.findById(decoded.userId);
      if (!users.length) return sendError(res, "User not found.", 401);

      const user = users[0];
      const token = generateAccessToken(user);

      sendSuccess(res, { token });
    } catch (error) {
      sendError(res, "Invalid or expired refresh token.", 403);
    }
  }
};

export default authCtrl;
