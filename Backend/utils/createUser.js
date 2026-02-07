import pool from "../config/pg.js";
import { getSchemaId } from "./getSchemaId.js";


export const createUser = async (payload) => {
    
    const schemaId = await getSchemaId(payload.api_key);
    const schemaName = "proj_" + schemaId;

    
    const cols = [];       
    const vals = [];       
    const placeholders = []; 

    let paramCounter = 1;

    
    for (const key in payload.data) {
        if (payload.data[key] != null) {
            cols.push(key);                
            vals.push(payload.data[key]);  
            placeholders.push(`$${paramCounter}`); 
            paramCounter++;
        }
    }

    if (cols.length === 0) {
        throw new Error("No valid data provided for user creation");
    }

    
    const query = `
        INSERT INTO "${schemaName}"._ub_auth_users (${cols.join(", ")})
        VALUES (${placeholders.join(", ")})
        RETURNING id, username;
    `;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await client.query(query, vals);

        await client.query('COMMIT');

        
        

        return result.rows[0];

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Create User Error:", err);
        throw err;
    } finally {
        client.release();
    }
};