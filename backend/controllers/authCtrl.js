import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../utils/jwtUtils.js';
import { sendError, sendSuccess } from '../utils/responseHandler.js';
// All database queries are abstracted into the repository layer
import userRepository from '../repositories/userRepository.js';

/** Shared cookie options for both token cookies. */
const cookieOptions = (maxAgeMs) => ({
  httpOnly: true,                                      // not accessible via document.cookie
  secure: process.env.NODE_ENV === 'production',       // HTTPS only in production
  sameSite: 'strict',                                  // CSRF protection
  maxAge: maxAgeMs,
});

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
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user.id);

      // Set tokens as HttpOnly cookies — inaccessible to JavaScript on the client
      res.cookie('accessToken', accessToken, cookieOptions(60 * 60 * 1000));           // 1 hour
      res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 days

      // Only return non-sensitive user info in the response body
      sendSuccess(res, {
        message: "Login successful!",
        user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email }
      });
    } catch (error) {
      sendError(res);
    }
  },

  refresh: async (req, res) => {
    // Read the refresh token from the HttpOnly cookie (not the request body)
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return sendError(res, "Refresh token required.", 401);

    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      const users = await userRepository.findById(decoded.userId);
      if (!users.length) return sendError(res, "User not found.", 401);

      const user = users[0];
      const accessToken = generateAccessToken(user);

      // Issue a fresh access token cookie
      res.cookie('accessToken', accessToken, cookieOptions(60 * 60 * 1000)); // 1 hour
      sendSuccess(res, { ok: true });
    } catch (error) {
      sendError(res, "Invalid or expired refresh token.", 403);
    }
  },

  /** Clears both auth cookies, effectively logging the user out server-side. */
  logout: (req, res) => {
    res.clearCookie('accessToken', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    sendSuccess(res, { ok: true });
  },
};

export default authCtrl;
