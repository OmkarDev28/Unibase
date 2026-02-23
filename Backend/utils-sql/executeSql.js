import pg from "../config/pg.js";
import { getSchemaId } from "../utils/getSchemaId.js";

export const executeSql = async (api_key, payload) => {
    const { sql, params } = payload;

    let schemaName;
    try {
        const schemaId = await getSchemaId(api_key);
        schemaName = `proj_${schemaId}`;
    } catch (e) {
        return { success: false, message: "Invalid API Key", userdata: null };
    }

    const client = await pg.connect();

    try {
       await client.query('BEGIN');
       await client.query(`SET search_path TO "${schemaName}"`);

       const response = await client.query(sql, params);

       await client.query(`SET search_path TO public`);

       await client.query('COMMIT');

        return {
            success: true,
            message: "Query executed successfully.",
            data: response.rows 
        };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("SQL Exec Error:", err)
        
        return {
            success: false,
            message: `Database Error: ${err.message}`,
            data: null
        };

    } finally {
        client.release();
    }

}
