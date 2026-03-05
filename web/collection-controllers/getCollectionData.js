import pool from '../config/pg.js'

export const getCollectionData = async (req, res) => {
    const { projectId, collectionName } = req.query;

    if (!projectId || !collectionName) {
        return res.status(400).json({ 
            success: false, 
            message: "Project ID and Collection Name are required." 
        });
    }

    const schemaName = `proj_${projectId}`;

    try {
        const query = `
            SELECT 
                d.id, 
                d.data, 
                d.created_at, 
                d.updated_at
            FROM "${schemaName}"._ub_collection_data d
            JOIN "${schemaName}"._ub_collections c ON d.collection_id = c.id
            WHERE c.name = $1
            ORDER BY d.created_at DESC;
        `;
        
        const result = await pool.query(query, [collectionName.toLowerCase()]);

        res.json({ 
            success: true, 
            count: result.rowCount,
            data: result.rows 
        });

    } catch (err) {
        console.error("Get Collection Data Error:", err);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch collection documents." 
        });
    }
};