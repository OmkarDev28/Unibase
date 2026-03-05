import pool from '../config/pg.js'

export const insertDocument = async (req, res) => {
    const { projectId, collectionName, document } = req.body;

    if (!projectId || !collectionName || !document) {
        return res.status(400).json({ 
            success: false, 
            message: "Missing required fields: projectId, collectionName, or document." 
        });
    }

    const schemaName = `proj_${projectId}`;

    try {
        const collectionQuery = `
            SELECT id FROM "${schemaName}"._ub_collections 
            WHERE name = $1 LIMIT 1;
        `;
        const collectionRes = await pool.query(collectionQuery, [collectionName.toLowerCase()]);

        if (collectionRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Collection not found." });
        }

        const collectionId = collectionRes.rows[0].id;

        // 2. Insert the actual JSON document
        const insertQuery = `
            INSERT INTO "${schemaName}"._ub_collection_data (collection_id, data) 
            VALUES ($1, $2) 
            RETURNING id, data, created_at;
        `;
        const result = await pool.query(insertQuery, [collectionId, document]);

        res.status(201).json({ 
            success: true, 
            message: "Document added!", 
            data: result.rows[0] 
        });

    } catch (err) {
        console.error("Insert Document Error:", err);
        res.status(500).json({ success: false, message: "Database insertion failed." });
    }
};