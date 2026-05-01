/**
 * systemPool.js
 *
 * Single pool that always connects to PG_URL_IPV6 — the cluster
 * that hosts the unibase_system schema (projects, db_instances,
 * project_deployments, users).
 *
 * Never use this pool for project-level queries (proj_* schemas).
 * Use poolRegistry.js for those.
 */

import { Pool } from 'pg';
import 'dotenv/config';

const systemPool = new Pool({
    connectionString: process.env.PG_URL_IPV6,
    rejectUnauthorized: false,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
});

systemPool.on('error', (err) => {
    console.error('[systemPool] Unexpected error:', err.message);
});

export default systemPool;