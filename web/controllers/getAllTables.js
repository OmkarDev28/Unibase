import pool from "../config/pg.js";

export const getAllTables = async (projectId) => {
     let schemaName = "proj_" + projectId;
     
     try {
        let query = `
            SELECT table_name
            FROM INFORMATION_SCHEMA.TABLES
            WHERE table_schema = $1
            AND table_type = 'BASE TABLE';
        `;
        
        
        const result = await pool.query(query, [schemaName]); 

        return {
            success: true,
            message: "Tables fetched successfully.",
            data: result.rows 
        };
        
     } catch (err) {
        console.error("Error while getting tables:", err);

        return {
            success: false,
            message: "Error while getting Tables.",
            data: null
        };
    }
}