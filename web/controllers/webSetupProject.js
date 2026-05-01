import systemPool from "../config/systemPool.js";
import { getPoolForProjectId } from "../config/poolRegistry.js";
import { generateApiKey } from "./createApiKey.js";

export const webSetupProject = async (userId, projectName) => {
    const newKey = generateApiKey();
    const systemClient = await systemPool.connect();

    try {
        await systemClient.query('BEGIN');

        // 1. Placement
        const placementResult = await systemClient.query(
            `SELECT unibase_system.get_best_instance() AS instance_id`
        );
        const instanceId = placementResult.rows[0]?.instance_id;
        if (!instanceId) throw new Error('No available shared instances.');

        // 2. Create project record
        const projectResult = await systemClient.query(
            `INSERT INTO unibase_system.projects (project_name, owner_id, api_key)
             VALUES ($1, $2, $3)
             RETURNING project_id`,
            [projectName, userId, newKey]
        );
        const projectId = projectResult.rows[0]?.project_id;
        if (!projectId) throw new Error('Project creation failed.');

        // 3. Create deployment mapping
        await systemClient.query(
            `INSERT INTO unibase_system.project_deployments
                (project_id, instance_id, is_active, notes)
             VALUES ($1, $2, TRUE, 'Initial deployment via shared placement')`,
            [projectId, instanceId]
        );

        await systemClient.query('COMMIT');

        // 4. Provision schema on the target instance
        //    Done outside the system transaction — uses the target instance pool
        const schema = `proj_${projectId}`;
        const instancePool = await getPoolForProjectId(projectId);
        const instanceClient = await instancePool.connect();

        try {
            await instanceClient.query(`CREATE SCHEMA "${schema}"`);
            await instanceClient.query(`SET search_path TO "${schema}"`);

            await instanceClient.query(`
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
            await instanceClient.query(`
                CREATE TABLE IF NOT EXISTS _ub_graph_nodes (
                    id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
                    type       TEXT    NOT NULL UNIQUE,
                    properties JSONB   NOT NULL DEFAULT '{}',
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);
            await instanceClient.query(`
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
            await instanceClient.query(`
                CREATE TABLE IF NOT EXISTS _ub_collections (
                    id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
                    name       VARCHAR(255)  NOT NULL UNIQUE,
                    created_at TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await instanceClient.query(`
                CREATE TABLE IF NOT EXISTS _ub_collection_data (
                    id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
                    collection_id UUID    REFERENCES _ub_collections(id) ON DELETE CASCADE,
                    data          JSONB   NOT NULL,
                    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);
            await instanceClient.query(`
                CREATE TABLE IF NOT EXISTS _ub_storage (
                    id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
                    file_name  TEXT    NOT NULL,
                    file_type  TEXT,
                    size       BIGINT,
                    url        TEXT    NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await instanceClient.query(`SET search_path TO public`);

        } finally {
            instanceClient.release();
        }

        return {
            success:     true,
            project_id:  projectId,
            api_key:     newKey,
            schema_name: schema,
            instance_id: instanceId,
        };

    } catch (err) {
        await systemClient.query('ROLLBACK').catch(() => {});
        console.error('setupProject error:', err);
        return {
            success: false,
            message: err.message,
            data:    null,
        };
    } finally {
        systemClient.release();
    }
};