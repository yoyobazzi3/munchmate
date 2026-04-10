import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool, { queryDB } from '../config/db.js';

dotenv.config();

const authCtrl = {
  signup: async (req, res) => {
    try {
      const { firstName, lastName, email, password, favoriteCuisines, priceRange } = req.body;
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "First name, last name, email, and password are required." });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters." });
      }

      if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        return res.status(400).json({ error: "Password must contain at least one uppercase letter and one number." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await queryDB(
        "INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)",
        [firstName, lastName, email, hashedPassword]
      );

      await queryDB(
        "INSERT INTO user_preferences (user_id, favorite_cuisines, preferred_price_range) VALUES (?, ?, ?)",
        [result.insertId, JSON.stringify(favoriteCuisines || []), priceRange || "$$"]
      );

      res.status(201).json({ message: "Signup successful! Please log in." });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const users = await queryDB("SELECT id, first_name, last_name, email, password_hash FROM users WHERE email = ?", [email]);

      if (!users.length || !(await bcrypt.compare(password, users[0].password_hash))) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const user = users[0];
      const token = jwt.sign(
        { userId: user.id, firstName: user.first_name, lastName: user.last_name },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ token, refreshToken, message: "Login successful!", user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email } });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },

  refresh: async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: "Refresh token required." });

    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      const users = await queryDB("SELECT id, first_name, last_name FROM users WHERE id = ?", [decoded.userId]);
      if (!users.length) return res.status(401).json({ error: "User not found." });

      const user = users[0];
      const token = jwt.sign(
        { userId: user.id, firstName: user.first_name, lastName: user.last_name },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ token });
    } catch (error) {
      res.status(403).json({ error: "Invalid or expired refresh token." });
    }
  }
};

export default authCtrl;
