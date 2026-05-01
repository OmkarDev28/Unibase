import { getPoolForProjectId } from "../config/poolRegistry.js";


export const getGraphNodes = async (req, res) => {
    const { projectId } = req.query;

    const pool = await getPoolForProjectId(projectId);

    if (!projectId) {
        return res.status(400).json({
            success: false,
            message: "Project ID is required."
        });
    }

    const schemaName = `proj_${projectId}`;

    try {
        const result = await pool.query(
            `SELECT id, type, properties, created_at
             FROM "${schemaName}"._ub_graph_nodes
             ORDER BY created_at DESC;`
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        console.error("Get Graph Nodes Error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch graph nodes."
        });
    }
};

export const getGraphEdges = async (req, res) => {
    const { projectId } = req.query;

    if (!projectId) {
        return res.status(400).json({
            success: false,
            message: "Project ID is required."
        });
    }

    const schemaName = `proj_${projectId}`;

    try {
        const result = await pool.query(
            `SELECT id, source_node_id, target_node_id, relation_type, properties, created_at
             FROM "${schemaName}"._ub_graph_edges
             ORDER BY created_at DESC;`
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        console.error("Get Graph Edges Error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch graph edges."
        });
    }
};