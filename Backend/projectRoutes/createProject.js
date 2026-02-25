import express from "express";
import pool from '../config/pg.js';
import { randomBytes } from "crypto";
import { setupProject } from "../utils/setupProject.js";
import { getProjectInfo } from "../utils-project/getProjectInfo.js";
import { getAllTables } from "../../web/controllers/getAllTables.js";
import { getTableData } from "../utils-project/getTableData.js";
import { log } from "console";


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

router.get("/get-projects", async (req, res) => {
    
    const { userId } = req.body;
    try {
        const allProjects = await getProjectInfo(userId);
        
        
        res.json({...allProjects})

    } catch {
        res.json()
    }
});

router.get("/get-tables", async (req, res) => {
    
    const { projectId } = req.query; 

    
    if (!projectId) {
        return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    try {
        
        const result = await getAllTables(projectId); 
        
        
        res.status(result.success ? 200 : 500).json(result);

    } catch (err) {
        console.error("Route Crash:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

router.get("/get-table-data", async (req, res) => {
    const { projectId, tableName } = req.query; 

    if (!projectId || !tableName) {
        return res.status(400).json({ 
            success: false, 
            message: "Project ID and Table Name are required" 
        });
    }

    try {
        const result = await getTableData(projectId, tableName);
        res.status(result.success ? 200 : 500).json(result);
    } catch (err) {
        console.error("Route Crash:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

export default router;