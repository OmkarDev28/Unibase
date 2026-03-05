import pool from '../config/pg.js'

export const getCollections = async (req, res) => {
    const { projectId } = req.query;

    if (!projectId) {
        return res.status(400).json({ 
            success: false, 
            message: "Project ID is required." 
        });
    }

    const schemaName = `proj_${projectId}`;

    try {
        const query = `
            SELECT id, name, created_at 
            FROM "${schemaName}"._ub_collections 
            ORDER BY created_at DESC;
        `;
        
        const result = await pool.query(query);

        res.json({ 
            success: true, 
            data: result.rows 
        });

    } catch (err) {
        console.error("Get Collections Error:", err);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch collections." 
        });
    }
};