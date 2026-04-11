import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../utils/jwtUtils.js';
import { sendError, sendSuccess } from '../utils/responseHandler.js';
import { validateSignupParams } from '../utils/validators/authValidator.js';
// All database queries are abstracted into the repository layer
import userRepository from '../repositories/userRepository.js';

/** 
 * Shared cookie options used for both access and refresh tokens.
 * Instructs the browser on how to securely handle the tokens.
 * @param {number} maxAgeMs - The expiration time of the cookie in milliseconds.
 * @returns {Object} Cookie options configuration.
 */
const cookieOptions = (maxAgeMs) => ({
  httpOnly: true,                                      // Prevent access strictly via client-side Javascript (document.cookie)
  secure: process.env.NODE_ENV === 'production',       // transmit cookie only over HTTPS in production
  sameSite: 'strict',                                  // CSRF protection - browser only sends cookie to the same origin
  maxAge: maxAgeMs,
});

/**
 * Controller containing the authentication flow logic for the application.
 */
const authCtrl = {
  /**
   * Registers a new user with their initial preferences.
   * Hashes the password and sets up default values.
   */
  signup: async (req, res) => {
    try {
      const { firstName, lastName, email, password, favoriteCuisines, priceRange } = req.body;
      
      const { isValid, error } = validateSignupParams(req.body);
      if (!isValid) return sendError(res, error, 400);

      // Hash the user's password using bcrypt with a salt factor of 10
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user then create their default preferences row in the database
      const result = await userRepository.createUser(firstName, lastName, email, hashedPassword);
      await userRepository.createPreferences(
        result.insertId,
        JSON.stringify(favoriteCuisines || []),
        priceRange || '$$'
      );

      sendSuccess(res, { message: "Signup successful! Please log in." }, 201);
    } catch (error) {
       console.error("Signup error:", error);
      sendError(res);
    }
  },

  /**
   * Authenticates a user using email and password.
   * If successful, issues JWT access and refresh tokens via HttpOnly cookies.
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const users = await userRepository.findByEmail(email);

      // Verify user exists and the supplied password matches the stored hash
      if (!users.length || !(await bcrypt.compare(password, users[0].password_hash))) {
        return sendError(res, "Invalid email or password.", 401);
      }

      const user = users[0];
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user.id);

      // Set tokens as HttpOnly cookies — inaccessible to JavaScript on the client
      res.cookie('accessToken', accessToken, cookieOptions(60 * 60 * 1000));           // 1 hour expiry
      res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 days expiry

      // Only return non-sensitive user info in the response body
      sendSuccess(res, {
        message: "Login successful!",
        user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email }
      });
    } catch (error) {
      console.error("Login error:", error);
      sendError(res);
    }
  },

  /**
   * Issues a new access token using a valid refresh token.
   * Does not require the user to log in again if their refresh token is still valid.
   */
  refresh: async (req, res) => {
    // Read the refresh token from the HttpOnly cookie (not the request body)
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return sendError(res, "Refresh token required.", 401);

    try {
      // Verify signature and decode the payload
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      
      const users = await userRepository.findById(decoded.userId);
      if (!users.length) return sendError(res, "User not found.", 401);

      const user = users[0];
      const accessToken = generateAccessToken(user);

      // Issue a fresh access token cookie
      res.cookie('accessToken', accessToken, cookieOptions(60 * 60 * 1000)); // 1 hour expiry
      sendSuccess(res, { message: "Token refreshed." });
    } catch (error) {
      console.error("Refresh error:", error);
      sendError(res, "Invalid or expired refresh token.", 403);
    }
  },

  /** 
   * Clears both JWT auth cookies, effectively logging the user out server-side.
   */
  logout: (_req, res) => {
    res.clearCookie('accessToken', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    sendSuccess(res, { message: "Logged out." });
  },
};

export default authCtrl;
