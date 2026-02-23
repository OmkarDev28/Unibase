import pool from "../config/pg.js";
import { getSchemaId } from "./getSchemaId.js";

export const loginWithUsername = async (api_key, payload) => {
    
    let schemaName;
    try {
        const schemaId = await getSchemaId(api_key);
        schemaName = "proj_" + schemaId;
    } catch (e) {
        return { success: false, message: "Invalid API Key", userdata: null };
    }

    const client = await pool.connect();

    try {
        const { username, password } = payload.data || {};
        
        if (!username || !password) {
            return {
                success: false,
                message: "Login failed: Username and Password are required.",
                userdata: null
            };
        }

        const query = `
            SELECT id, username, phone, email, is_active, role, created_at 
            FROM "${schemaName}"._ub_auth_users
            WHERE username = $1 AND password = $2;
        `;

        const result = await client.query(query, [username, password]);
        const user = result.rows[0];

        if (!user) {
            return {
                success: false,
                message: "Invalid credentials (User not found or password incorrect).",
                userdata: null
            };
        }

        return {
            success: true,
            message: "Login successful.",
            userdata: user
        };

    } catch (err) {
        console.error("Error while logging in:", err);
        return {
            success: false,
            message: `Login Error: ${err.message}`,
            userdata: null
        };
    } finally {
        client.release();
    }
};