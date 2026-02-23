import pool from "../config/pg.js";
import { getSchemaId } from "./getSchemaId.js";

export const getUserId = async (api_key, payload) => {
    
    let schemaName;
    try {
        const schemaId = await getSchemaId(api_key);
        schemaName = "proj_" + schemaId;
    } catch (e) {
        return { success: false, message: "Invalid API Key", userdata: null };
    }

    const client = await pool.connect();

    try {
        const username = payload.data?.username;

        if (!username) {
            return {
                success: false,
                message: "Get User ID failed: Username is required in payload.",
                userdata: null
            };
        }

        const query = `
            SELECT id FROM "${schemaName}"._ub_auth_users
            WHERE username = $1;
        `;

        const result = await client.query(query, [username]);

        if (result.rows.length === 0) {
            return {
                success: false,
                message: "User not found.",
                userdata: null
            };
        }

        return {
            success: true,
            message: "User ID fetched successfully.",
            userdata: result.rows[0] 
        };

    } catch (err) {
        console.error("Error while fetching user Id:", err);

        return {
            success: false,
            message: `Database Error: ${err.message}`,
            userdata: null
        };

    } finally {
        client.release();
    }
};