import pool from '../config/pg.js';
import { generateApiKey } from "./createApiKey.js";

/**
 * Creates a new project using the Decoupled 3-Table Architecture.
 *
 * Steps:
 *   1. Run placement — pick the least-loaded shared instance via get_best_instance()
 *   2. Insert into unibase_system.projects
 *   3. Insert active row into unibase_system.project_deployments
 *      (trigger syncs projects.current_instance_id automatically)
 *   4. Create the project schema + system tables on the *target* instance
 */
export const webSetupProject = async (userId, projectName) => {
    const newKey = generateApiKey();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // ── 1. Placement: find the best available instance ──────────────────
        const placementResult = await client.query(
            `SELECT unibase_system.get_best_instance() AS instance_id`
        );

        const instanceId = placementResult.rows[0]?.instance_id;
        if (!instanceId) {
            throw new Error(
                'No available shared instances. All clusters are at capacity or offline.'
            );
        }

        // ── 2. Create the project record ────────────────────────────────────
        const projectResult = await client.query(
            `INSERT INTO unibase_system.projects (project_name, owner_id, api_key)
             VALUES ($1, $2, $3)
             RETURNING project_id`,
            [projectName, userId, newKey]
        );

        const projectId = projectResult.rows[0]?.project_id;
        if (!projectId) {
            throw new Error('Project creation failed — no project_id returned.');
        }

        // ── 3. Create the deployment mapping (trigger keeps projects in sync) ─
        await client.query(
            `INSERT INTO unibase_system.project_deployments
                 (project_id, instance_id, is_active, notes)
             VALUES ($1, $2, TRUE, 'Initial deployment via shared placement')`,
            [projectId, instanceId]
        );

        // ── 4. Provision the project schema on the target instance ───────────
        //
        // If all instances share the same Postgres cluster (your current setup),
        // we can use the same pool connection. When you add truly separate
        // clusters, swap `client` here for a new Pool built from the instance's
        // decrypted conn_string.
        //
        const schema = `proj_${projectId}`;
        await client.query(`CREATE SCHEMA "${schema}"`);
        await client.query(`SET search_path TO "${schema}"`);

        // Auth table
        await client.query(`
            CREATE TABLE IF NOT EXISTS Authentication (
                id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                username   TEXT        UNIQUE,
                phone      TEXT        UNIQUE,
                email      TEXT        UNIQUE,
                password   TEXT,
                role       TEXT        NOT NULL DEFAULT 'user',
                is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        // Graph tables
        await client.query(`
            CREATE TABLE IF NOT EXISTS _ub_graph_nodes (
                id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
                type       TEXT    NOT NULL UNIQUE,
                properties JSONB   NOT NULL DEFAULT '{}',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS _ub_graph_edges (
                id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
                source_node_id UUID    NOT NULL REFERENCES _ub_graph_nodes(id) ON DELETE CASCADE,
                target_node_id UUID    NOT NULL REFERENCES _ub_graph_nodes(id) ON DELETE CASCADE,
                relation_type  TEXT    NOT NULL,
                properties     JSONB   NOT NULL DEFAULT '{}',
                created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (source_node_id, target_node_id, relation_type)
            )
        `);

        // Collections tables
        await client.query(`
            CREATE TABLE IF NOT EXISTS _ub_collections (
                id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
                name       VARCHAR(255)  NOT NULL UNIQUE,
                created_at TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS _ub_collection_data (
                id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
                collection_id UUID    REFERENCES _ub_collections(id) ON DELETE CASCADE,
                data          JSONB   NOT NULL,
                created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        // Storage table
        await client.query(`
            CREATE TABLE IF NOT EXISTS _ub_storage (
                id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
                file_name  TEXT    NOT NULL,
                file_type  TEXT,
                size       BIGINT,
                url        TEXT    NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(`SET search_path TO public`);
        await client.query('COMMIT');

        return {
            success: true,
            project_id:  projectId,
            api_key:     newKey,
            schema_name: schema,
            instance_id: instanceId,
        };


    } catch (err) {
        await client.query('ROLLBACK');
        console.error('setupProject error:', err);
        return {
            success: false,
            message: err.message,
            data: null,
        };
    } finally {
        client.release();
    }
};