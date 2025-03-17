import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

const signupCtrl = {
  /**
   * Handles user signup (Manual and Google)
   */
  signup: async (req, res) => {
    try {
      const { firstName, lastName, email, password, isGoogleSignup } = req.body;

      if (!email || (!isGoogleSignup && (!firstName || !lastName || !password))) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Check if user already exists
      const [existingUser] = await pool.query("SELECT userID FROM users WHERE email = ?", [email]);
      if (existingUser.length > 0) {
        return res.status(400).json({ error: "User already exists" });
      }

      let hashedPassword = null;
      if (!isGoogleSignup) {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password, salt);
      }

      // Insert new user
      const [result] = await pool.query(
        "INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)",
        [firstName || "", lastName || "", email, hashedPassword]
      );

      // Generate JWT token
      const token = jwt.sign({ id: result.insertId, email }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      res.status(201).json({ message: "User registered successfully", token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  }
};

export default signupCtrl;