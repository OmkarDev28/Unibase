import express from "express";
import { executeEditorSql } from "../utils-sql/executeEditorSql.js";

const router = express.Router();

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