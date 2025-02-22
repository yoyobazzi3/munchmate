import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/database';

// Signup Controller
exports.signup = async (req, res) => {
    const {username, email, password_hash} = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password_hash, 10);
        const sql = 'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)';
        db.query(sql, [username, email, hashedPassword], (err, res) => {
            if (err) return res.status(500).json({error: 'Database error'});
            res.status(201).json({message: 'User created'});
        });
    } catch (error) {
        res.status(500).json({error: 'Internal Server Error'});
    }
};