import express from "express";
import pool from '../config/pg.js';
import { randomBytes } from "crypto";
import { setupProject } from "../utils/setupProject.js";


const router = express.Router();

router.post('/create-project', async (req, res) => {
    const { userId, projectName } = req.body;
    
    try {
        const newProject = await setupProject(userId, projectName);

        

        res.status(201).json({
            ...newProject
        });

    }catch (err) {
        
        throw err;
    } 
});

export default router;