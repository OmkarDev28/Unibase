import pool from "../config/pg.js";

export const getTableData = async (projectId, tableName) => {
    const schemaName = `proj_${projectId}`;
     
    try {

        const isValidIdentifier = /^[a-zA-Z0-9_]+$/.test(tableName);
        if (!isValidIdentifier) {
            throw new Error("Invalid table name format");
        }

        const query = `
            SELECT * FROM "${schemaName}"."${tableName}"
            LIMIT 100;
        `;
        
        const result = await pool.query(query);

        return {
            success: true,
            message: `Data fetched for table: ${tableName}`,
            data: {
                columns: result.fields.map(field => field.name),
                rows: result.rows
            }
        };
        
    } catch (err) {
        console.error(`Error getting data for ${tableName}:`, err.message);

        return {
            success: false,
            message: "Error fetching table data.",
            data: null
        };
    }
}