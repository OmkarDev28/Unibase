import pool from '../config/pg.js';

export const createCollection = async (req, res) => {
    const { projectId, collectionName } = req.body;

    if (!projectId || !collectionName) {
        return res.status(400).json({ 
            success: false, 
            message: "Project ID and Collection Name are required." 
        });
    }

    const schemaName = `proj_${projectId}`;
    const normalizedName = collectionName.toLowerCase().trim();

    try {
        const query = `
            INSERT INTO "${schemaName}"._ub_collections (name) 
            VALUES ($1) 
            RETURNING *;
        `;
        const result = await pool.query(query, [normalizedName]);

        res.status(201).json({ 
            success: true, 
            message: "Collection created successfully", 
            data: result.rows[0] 
        });

    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ 
                success: false, 
                message: `Collection '${normalizedName}' already exists.` 
            });
        }
        
        console.error("Controller Error:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};