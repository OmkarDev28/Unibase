import express from "express";
import pool from '../config/pg.js';
import { createUser } from "../utils/createUser.js";
import { updateUser } from "../utils/updateUser.js";


const router = express.Router();

router.post("/create-user", async (req, res) => {
    const payload = req.body;

    

    const action = payload.action;
    let result, message;
    try {
        switch (action) {
            case "create_user":
                result = await createUser(payload);
                message = "User created successfully."
                break;
            case "update_user":
                result = await updateUser(payload);
                message = "User updated successfully."
                break;
            // ... more cases ...
            default:
                // Code to execute if none of the cases match
            }
    
    res.status(201).json({ success: true, message, ...result}); 

         
    } catch (err) {
        
        throw err;
    } 
});

export default router;
