import pool from "../config/pg.js";

export const getProjectConnectionDetails = async (req, res) => {
    const { projectId } = req.params;
    
    const baseUrl = process.env.ENGINE_BASE_URL + `/${projectId}`;

    try {
        
        const result = await pool.query(
            `SELECT api_key 
             FROM unibase_system.projects 
             WHERE project_id = $1`,
            [projectId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        const projectData = result.rows[0];

        res.status(200).json({
            success: true,
            message: "Connection details retrieved successfully",
            data: {
                projectName: projectData.name,
                baseUrl: baseUrl,
                apiKey: projectData.api_key || null 
            }
        });

    } catch (err) {
        console.error("Error fetching connection details:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};