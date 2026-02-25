import express from "express";

import { setupProject } from "../controllers/setupProject.js";
import { getAllTables } from "../controllers/getAllTables.js";
import { getProjectInfo } from "../controllers/getProjectInfo.js";
import { getTableData } from "../controllers/getTableData.js";
import { executeEditorSql } from "../controllers/executeEditorSql.js";
import { getProjectConnectionDetails } from "../controllers/getProjectConnectionDetails.js";



const router = express.Router();

router.get("/:projectId/connect", getProjectConnectionDetails);



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
    
    const { userId } = req.query;
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

router.post("/execute-editor-sql", async (req, res) => {
    const { projectId, sqlQuery } = req.body; 

    if (!projectId || !sqlQuery) {
        return res.status(400).json({ 
            success: false, 
            message: "Project ID and SQL Query are required" 
        });
    }

    try {
        const result = await executeEditorSql(projectId, sqlQuery);

        res.status(200).json(result);

    } catch (err) {
        console.error("Editor Route Crash:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});



export default router;