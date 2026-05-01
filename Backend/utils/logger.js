// helpers/logger.js
import systemPool from "../config/systemPool.js";

export const logSystemAction = (projectId, action, status, durationMs, error = null, metadata = {}) => {
    // 1. Safety: Ensure action is truncated to prevent table bloat
    const safeAction = action ? action.substring(0, 255) : 'unknown_action';
    
    // 2. Safety: Ensure metadata is always a valid JSON object
    const safeMetadata = (typeof metadata === 'object' && metadata !== null) ? metadata : {};

    // 3. The Query
    pool.query(
        `INSERT INTO unibase_system._ub_logs 
         (project_id, action, status, duration_ms, error, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [projectId, safeAction, status, durationMs, error, safeMetadata]
    ).catch(err => console.error("Logging failed:", err));
};