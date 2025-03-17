import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

const loginCtrl = {
  /**
   * Handles user login (Manual and Google)
   */
  login: async (req, res) => {
    try {
      const { email, password, isGoogleLogin } = req.body;

      if (!email || (!isGoogleLogin && !password)) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Fetch user from database
      const [userRows] = await pool.query("SELECT userID, email, password FROM users WHERE email = ?", [email]);

      if (!userRows.length) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const user = userRows[0];

      // Skip password check for Google Sign-In users
      if (!isGoogleLogin) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ error: "Invalid email or password" });
        }
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.userID, email: user.email, exp: Math.floor(Date.now() / 1000) + 3600 }, // 1-hour expiration
        process.env.JWT_SECRET
      );

      res.status(200).json({ message: "Login successful", token, user: { id: user.userID, email: user.email } });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

export default loginCtrl;