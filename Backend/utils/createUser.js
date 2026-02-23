import pool from "../config/pg.js";
import { getSchemaId } from "./getSchemaId.js";

export const createUser = async (api_key, payload) => {
    
    let schemaName;

    
    try {
        const schemaId = await getSchemaId(api_key);
        schemaName = "proj_" + schemaId;
    } catch (e) {
        return { success: false, message: "Invalid API Key", userdata: null };
    }

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
        return { success: false, message: "No data provided.", userdata: null };
    }

    const query = `
        INSERT INTO "${schemaName}"._ub_auth_users (${cols.join(", ")})
        VALUES (${placeholders.join(", ")})
        RETURNING id, username, email, role, phone;
    `;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await client.query(query, vals);

        await client.query('COMMIT');

        return {
            success: true,
            message: "User created successfully.",
            userdata: result.rows[0] 
        };

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Create User Error:", err);
        
        if (err.code === '23505') {
            return {
                success: false,
                message: "User creation failed: Username or Email already exists.",
                userdata: null
            };
        }

        return {
            success: false,
            message: `Database Error: ${err.message}`,
            userdata: null
        };

    } finally {
        client.release();
    }
};