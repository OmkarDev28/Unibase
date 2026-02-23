import pool from "../config/pg.js";
import { getSchemaId } from "./getSchemaId.js";

export const updateUser = async (api_key, payload) => {
    
    let schemaName;
    try {
        const schemaId = await getSchemaId(api_key);
        schemaName = `proj_${schemaId}`;
    } catch (e) {
        return { success: false, message: "Invalid API Key", userdata: null };
    }

    if (!payload.id) {
        return { success: false, message: "Update failed: User ID is required.", userdata: null };
    }
    if (!payload.data || Object.keys(payload.data).length === 0) {
        return { success: false, message: "Update failed: No data provided to update.", userdata: null };
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
            return {
                success: false,
                message: "User not found. No records updated.",
                userdata: null
            };
        }

        return {
            success: true,
            message: "User updated successfully.",
            userdata: result.rows[0]
        };

    } catch (err) {
        console.error("Update User Error:", err);

        if (err.code === '23505') {
            return {
                success: false,
                message: "Update failed: The email or username is already taken.",
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