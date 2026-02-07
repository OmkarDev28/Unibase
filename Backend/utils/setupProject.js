import express from "express";
import pool from '../config/pg.js';
import { generateApiKey } from "./createApiKey.js";

export const setupProject = async (userId, projectName) => {
    const newKey = generateApiKey();

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const insertQuery = `
           INSERT INTO unibase_system.projects (project_name, owner_id, api_key)
           VALUES ($1, $2, $3)
           RETURNING project_id;
        `
        const newProject = await client.query(insertQuery, [projectName, userId, newKey]);

        if (!newProject.rows || newProject.rows.length === 0) {
         throw new Error('Project creation failed.');
        }

        const projectId = newProject.rows[0].project_id;

        
        await client.query(`CREATE SCHEMA "proj_${projectId}";`);

        await client.query(`SET search_path TO "proj_${projectId}"`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS _ub_auth_users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  
                username TEXT UNIQUE,
                phone TEXT UNIQUE,      
                email TEXT UNIQUE,
                password TEXT ,       
                role TEXT DEFAULT 'user',          
                is_active BOOLEAN DEFAULT TRUE,    
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS _ub_graph_nodes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                type TEXT NOT NULL,            
                properties JSONB DEFAULT '{}', 
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS _ub_graph_edges (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                
                -- RELATIONSHIPS
                source_node_id UUID NOT NULL REFERENCES _ub_graph_nodes(id) ON DELETE CASCADE,
                target_node_id UUID NOT NULL REFERENCES _ub_graph_nodes(id) ON DELETE CASCADE,
                
                relation_type TEXT NOT NULL,   -- e.g., 'FOLLOWS', 'LIKED', 'BLOCKED'
                properties JSONB DEFAULT '{}', -- e.g., { "since": "2023-01-01", "weight": 5 }
                created_at TIMESTAMP DEFAULT NOW(),

                -- CONSTRAINT: Prevent duplicate links of the same type
                UNIQUE(source_node_id, target_node_id, relation_type)
            );
        `);

        
        await client.query(`SET search_path TO public`);
        
        await client.query('COMMIT');

        return {
            project_id: projectId,
            api_key: newKey,
            schema_name: "proj_" + projectId
        };


    }catch (err) {
        await client.query('ROLLBACK'); 
        throw err;
    } finally {
        client.release(); 
    } 
}
