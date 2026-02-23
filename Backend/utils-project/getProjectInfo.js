import express from "express";
import pool from "../../Backend/config/pg.js";

export const getProjectInfo = async (userId) => {

    let schemaName;
    
    console.log("a");

    const client = await pool.connect();

    try {
        const result = await client.query(`
              SELECT * FROM unibase_system.projects
              WHERE owner_id = $1`, 
              [userId]);

        
        

        return {
            success: true,
            message: "Projects fetched successfully.",
            data: result.rows
        }
    } catch (err) {
        console.error("Error while getting projects:", err);

        return {
            success: false,
            message: "Error while getting projects.",
            data: null
        }

    } finally {
        client.release();
    }

    



    
    
}