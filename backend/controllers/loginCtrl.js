dotenv.config();

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../config/db.js';


const loginCtrl = {
  /**
   * Handles user login.
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Fetch user from database
      const [userRows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

      if (userRows.length === 0) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const user = userRows[0];

      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign({ id: user.userID, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      res.status(200).json({ message: "Login successful", token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  }
};

export default loginCtrl;