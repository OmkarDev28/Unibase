import pool from "../config/pg.js";

export const getSchemaId = async (api_key) => {

    const query = `
        SELECT project_id FROM unibase_system.projects
        WHERE api_key = $1;
    `
    const result = await pool.query(query , [api_key]);

    if (result.rows.length === 0) {
        return null; 
    }

  return result.rows[0].project_id;

};

