import { getPoolForApiKey }  from '../config/poolRegistry.js';
import { getSchemaId }       from '../utils/getSchemaId.js';
import { logSystemAction }   from '../utils/logger.js';
 
export const executeSql = async (api_key, payload) => {
    const { sql, params } = payload;
 
    let schemaId;
    try {
        schemaId = await getSchemaId(api_key);
    } catch (e) {
        return { success: false, message: 'Invalid API Key', data: null };
    }
 
    // Route to the correct instance for this project
    const pool        = await getPoolForApiKey(api_key);
    const client      = await pool.connect();
    const startTimer  = performance.now();
    const schemaName  = `proj_${schemaId}`;
 
    try {
        await client.query('BEGIN');
        await client.query(`SET search_path TO "${schemaName}"`);
 
        const response = await client.query(sql, params);
        const durationMs = Math.round(performance.now() - startTimer);
 
        logSystemAction(schemaId, sql, 200, durationMs, null, { rowCount: response.rowCount });
        await client.query('COMMIT');
 
        return {
            success: true,
            message: 'Query executed successfully.',
            data:    response.rows,
            meta:    { duration: `${durationMs}ms` },
        };
 
    } catch (err) {
        await client.query('ROLLBACK');
        const durationMs = Math.round(performance.now() - startTimer);
        logSystemAction(schemaId, sql, 500, durationMs, err.message);
 
        return {
            success: false,
            message: `Database Error: ${err.message}`,
            data:    null,
        };
 
    } finally {
        try { await client.query(`SET search_path TO public`); } catch (_) {}
        client.release();
    }
};
