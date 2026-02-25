import pool from "../../Backend/config/pg.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "Some secrete";

export const registerAdmin = async (req, res) => {
    
    const { username, email, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    try {
        
        let conflictQuery = "SELECT id, username, email FROM unibase_system.users WHERE username = $1";
        let conflictValues = [username];

        if (email) {
            conflictQuery += " OR email = $2";
            conflictValues.push(email);
        }

        const existingUser = await pool.query(conflictQuery, conflictValues);
        
        if (existingUser.rows.length > 0) {
            const conflict = existingUser.rows[0];
            if (conflict.username === username) {
                return res.status(400).json({ success: false, message: "Username already taken" });
            }
            if (conflict.email === email) {
                return res.status(400).json({ success: false, message: "Email already registered" });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await pool.query(
            "INSERT INTO unibase_system.users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email",
            [username, email || null, hashedPassword]
        );

        const user = newUser.rows[0];

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

        res.status(201).json({
            success: true,
            message: "Registration successful",
            data: { user, token }
        });

    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const loginAdmin = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
         return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    try {
        const userResult = await pool.query(
            "SELECT * FROM unibase_system.users WHERE username = $1", 
            [username]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

        delete user.password; 

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: { user, token }
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};