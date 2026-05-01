/**
 * poolRegistry.js
 *
 * Maintains one pg.Pool per db_instance.
 * Routes connections by api_key or project_id to the correct cluster.
 *
 * Cache layers:
 *   L1 — in-memory Map  (apiKey/projectId → instanceId, TTL 5 min)
 *   L2 — system DB      (unibase_system schema, always on PG_URL_IPV6)
 *   Pool map            (instanceId → pg.Pool, lives for process lifetime)
 *
 * Usage:
 *   import { getPoolForApiKey, getPoolForProjectId } from './poolRegistry.js';
 *
 *   // in any SDK route:
 *   const pool = await getPoolForApiKey(req.headers['ub-api-key']);
 *   const client = await pool.connect();
 *
 *   // in any web route:
 *   const pool = await getPoolForProjectId(projectId);
 *   const client = await pool.connect();
 *
 *   // system-level queries (unibase_system schema):
 *   import systemPool from './systemPool.js';
 *   const client = await systemPool.connect();
 */

import { Pool } from 'pg';

// ── System pool (always PG_URL_IPV6 — unibase_system schema lives here) ────
import systemPool from './systemPool.js';

// ── Pool registry: instanceId → pg.Pool ────────────────────────────────────
const poolMap = new Map();

function getOrCreatePool(instanceId, connString) {
    if (poolMap.has(instanceId)) return poolMap.get(instanceId);

    const pool = new Pool({
        connectionString: connString,
        rejectUnauthorized: false,
        max: 10,               // per-instance connection cap
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
    });

    pool.on('error', (err) => {
        console.error(`[poolRegistry] Pool error on instance ${instanceId}:`, err.message);
        // Remove so next request rebuilds it with a fresh lookup
        poolMap.delete(instanceId);
    });

    poolMap.set(instanceId, pool);
    return pool;
}

// ── L1 cache: routing maps (TTL-based) ─────────────────────────────────────
const TTL_MS = 5 * 60 * 1000;  // 5 minutes

const apiKeyCache    = new Map();  // apiKey    → { instanceId, connString, ts }
const projectIdCache = new Map();  // projectId → { instanceId, connString, ts }

function isFresh(entry) {
    return entry && (Date.now() - entry.ts) < TTL_MS;
}

// ── Core lookup: hits L1 then L2 ───────────────────────────────────────────

/**
 * Resolves instance info for an api_key.
 * Joins projects → project_deployments → db_instances in one query.
 */
async function resolveByApiKey(apiKey) {
    const cached = apiKeyCache.get(apiKey);
    if (isFresh(cached)) return cached;

    const result = await systemPool.query(
        `SELECT i.instance_id, i.conn_string
         FROM unibase_system.projects p
         JOIN unibase_system.project_deployments d
              ON d.project_id = p.project_id AND d.is_active = TRUE
         JOIN unibase_system.db_instances i
              ON i.instance_id = d.instance_id AND i.is_active = TRUE
         WHERE p.api_key = $1`,
        [apiKey]
    );

    if (result.rows.length === 0) {
        throw new Error(`[poolRegistry] No active instance found for api_key.`);
    }

    const entry = { ...result.rows[0], ts: Date.now() };
    apiKeyCache.set(apiKey, entry);
    return entry;
}

/**
 * Resolves instance info for a project_id.
 */
async function resolveByProjectId(projectId) {
    const cached = projectIdCache.get(projectId);
    if (isFresh(cached)) return cached;

    const result = await systemPool.query(
        `SELECT i.instance_id, i.conn_string
         FROM unibase_system.project_deployments d
         JOIN unibase_system.db_instances i
              ON i.instance_id = d.instance_id AND i.is_active = TRUE
         WHERE d.project_id = $1 AND d.is_active = TRUE`,
        [projectId]
    );

    if (result.rows.length === 0) {
        throw new Error(`[poolRegistry] No active instance found for project_id: ${projectId}`);
    }

    const entry = { ...result.rows[0], ts: Date.now() };
    projectIdCache.set(projectId, entry);
    return entry;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the pg.Pool for the instance that hosts the given api_key's project.
 * Use this in all SDK routes.
 */
export async function getPoolForApiKey(apiKey) {
    const { instance_id, conn_string } = await resolveByApiKey(apiKey);
    return getOrCreatePool(instance_id, conn_string);
}

/**
 * Returns the pg.Pool for the instance that hosts the given project_id.
 * Use this in all web/dashboard routes.
 */
export async function getPoolForProjectId(projectId) {
    const { instance_id, conn_string } = await resolveByProjectId(projectId);
    return getOrCreatePool(instance_id, conn_string);
}

/**
 * Returns the schema name for a project on its instance, plus its pool.
 * Convenience wrapper — most query helpers need both together.
 *
 * Returns: { pool, schemaName, instanceId }
 */
export async function getProjectContext(apiKey) {
    const { instance_id, conn_string } = await resolveByApiKey(apiKey);

    // Also fetch project_id so we can build the schema name
    const result = await systemPool.query(
        `SELECT p.project_id
         FROM unibase_system.projects p
         WHERE p.api_key = $1`,
        [apiKey]
    );

    if (result.rows.length === 0) throw new Error('Invalid API key.');

    const projectId  = result.rows[0].project_id;
    const schemaName = `proj_${projectId}`;
    const pool       = getOrCreatePool(instance_id, conn_string);

    return { pool, schemaName, instanceId: instance_id };
}

/**
 * Invalidate cache entries for a project after a migration.
 * Call this right after unibase_system.migrate_project() completes.
 */
export function invalidateProject(projectId, apiKey) {
    projectIdCache.delete(projectId);
    if (apiKey) apiKeyCache.delete(apiKey);
}

/**
 * Drain all pools cleanly — call on process SIGTERM.
 */
export async function drainAllPools() {
    const drains = [...poolMap.values()].map(p => p.end());
    await Promise.allSettled(drains);
    poolMap.clear();
}