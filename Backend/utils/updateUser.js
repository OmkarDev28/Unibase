import pool from "../config/pg.js";
import { getSchemaId } from "./getSchemaId.js";


export const updateUser = async (payload) => {
   
    const schemaId = await getSchemaId(payload.api_key);
    const schemaName = `proj_${schemaId}`;

    
    if (!payload.id) {
        throw new Error("Update failed: User ID is required.");
    }
    if (!payload.data || Object.keys(payload.data).length === 0) {
        throw new Error("Update failed: No data provided to update.");
    }

    
    const setClauses = []; 
    const values = [];      
    let paramCounter = 1;

    
    for (const key in payload.data) {
      
        if (payload.data[key] !== undefined) {
            setClauses.push(`${key} = $${paramCounter}`);
            values.push(payload.data[key]);
            paramCounter++;
        }
    }

    
    values.push(payload.id);
    const idPlaceholder = `$${paramCounter}`;

    
    const query = `
        UPDATE "${schemaName}"._ub_auth_users 
        SET ${setClauses.join(', ')}
        WHERE id = ${idPlaceholder}
        RETURNING id, username, phone, email, is_active, role, created_at;
    `;

    const client = await pool.connect();

    try {
        const result = await client.query(query, values);

        if (result.rows.length === 0) {
            throw new Error("User not found or update failed.");
        }

        return result.rows[0];

    } catch (err) {
        console.error("Update User Error:", err);
        throw err;
    } finally {
        client.release();
    }
};


