import express from "express";
import pool from '../../config/pg.js';
import jwt from "jsonwebtoken";


const router = express.Router();

router.post('/register', async (req, res) => {
    console.log(req.body);
    
    const { username, email, password} = req.body;

    const client = await pool.connect();
    
    try{
        await client.query('BEGIN');

        

        const insertQuery = `
            INSERT INTO unibase_system.users (username, email, password) 
            VALUES ($1, $2, $3) 
            RETURNING *;
        `;

        const result = await client.query(insertQuery, [username, email, password]);

        if (!result.rows || result.rows.length === 0) {
         throw new Error('User insert failed');
        }

        const newUser = result.rows[0]; 
        
        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: newUser
        });

    }catch (err) {
        await client.query('ROLLBACK'); 
        throw err;
    } finally {
        client.release(); 
    }    
})

router.post('/login', async (req, res) => {
    console.log(req.body);
    
    const { username, password} = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const selectQuery = `
           SELECT * FROM unibase_system.users
           WHERE username = $1 AND password = $2;
        `;

        const result = await client.query(selectQuery, [username, password]);
        
        if (!result.rows || result.rows.length === 0) {
         throw new Error('User not found.');
        }

        const User = result.rows[0]; 

        await client.query('COMMIT');

        const token = jwt.sign(
            { id: User.id, username: User.username, role: 'sde' },
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.cookie('unibase_admin_session', token, {
            httpOnly: true,  
            secure: true,   
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 
        });

        res.status(200).json({
            success: true,
            message: "User verified successfully.",
            user: {
                id: User.id,
                username: User.username,
                email: User.email
            }
        });
    }catch (err) {
        await client.query('ROLLBACK'); 
        throw err;
    } finally {
        client.release(); 
    } 
});
export default router;