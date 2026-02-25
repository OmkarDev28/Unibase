import pool from "../config/pg.js";

export const executeEditorSql = async (projectId, sqlQuery) => {
    const client = await pool.connect(); 
    const startTimer = performance.now(); 

    try {
        
        await client.query(`SET search_path TO "proj_${projectId}"`);

        
        const result = await client.query(sqlQuery);

        const durationMs = (performance.now() - startTimer).toFixed(2);


        return {
            success: true,
            meta: {
                command: result.command, 
                rowCount: result.rowCount || 0,
                duration: `${durationMs}ms`,
                
                columns: result.fields ? result.fields.map(f => f.name) : [] 
            },
            data: result.rows || []
        };

    } catch (err) {
        
        return {
            success: false,
            message: err.message, 
            position: err.position 
        };
    } finally {
        
        await client.query(`SET search_path TO public`);
        client.release();
    }
};