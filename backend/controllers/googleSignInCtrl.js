// controllers/googleSignInCtrl.js
import pool from '../config/db.js';

const googleSignInCtrl = {
  googleSignIn: async (req, res) => {
    try {
      const { email, name } = req.body;

      // Check if the user already exists in the database
      const [userRows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

      if (userRows.length === 0) {
        // If the user doesn't exist, create a new user
        const [result] = await pool.query(
          "INSERT INTO users (email, name, password) VALUES (?, ?, ?)",
          [email, name, 'google-auth'] // Use a placeholder password for Google-authenticated users
        );
        console.log('New user created:', result);
      }

      // Return a success response
      res.status(200).json({ message: "Google sign-in successful" });
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      res.status(500).json({ error: "Server error" });
    }
  },
};

export default googleSignInCtrl;