import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { getCollection } from '../config/mongodb.js';

dotenv.config();

const authCtrl = {
  signup: async (req, res) => {
    try {
      const { firstName, lastName, email, password, favoriteCuisines, priceRange } = req.body;
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "First name, last name, email, and password are required." });
      }

      const usersCollection = await getCollection('users');

      // Check if user already exists
      const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered. Please log in." });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user document with embedded preferences
      const now = new Date();
      const newUser = {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        preferences: {
          favoriteCuisines: favoriteCuisines || [],
          preferredPriceRange: priceRange || "$$",
          likedFoods: "",
          dislikedFoods: ""
        },
        createdAt: now,
        updatedAt: now
      };

      const result = await usersCollection.insertOne(newUser);

      res.status(201).json({ 
        message: "Signup successful! Please log in.",
        userId: result.insertedId.toString()
      });
    } catch (error) {
      console.error("Signup error:", error);
      
      // Handle duplicate key error (email unique index)
      if (error.code === 11000) {
        return res.status(400).json({ error: "Email already registered. Please log in." });
      }
      
      res.status(500).json({ error: "Internal server error" });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      const usersCollection = await getCollection('users');
      
      // Find user by email (case-insensitive)
      const user = await usersCollection.findOne({ email: email.toLowerCase() });

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      // Generate JWT token with user ID as string
      const token = jwt.sign(
        { 
          userId: user._id.toString(), 
          firstName: user.firstName, 
          lastName: user.lastName 
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ 
        token, 
        message: "Login successful!", 
        user: { 
          id: user._id.toString(), 
          firstName: user.firstName, 
          lastName: user.lastName 
        } 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

export default authCtrl;