import express from "express";
import { executeSql } from "../utils-sql/executeSql.js";
import { buildSelect, buildInsert, buildUpdate, buildDelete } from "../utils-sql/queryBuilders.js";

const router = express.Router();

router.post("/query", async (req, res) => {
    const payload = req.body;
    const api_key = req.headers['ub-api-key'];
    const { action } = payload;

    try {
        let finalSql = "";

        switch (action) {
            case "raw_sql":
                finalSql = payload.sql;
                break;

            case "SELECT":
                finalSql = buildSelect(payload);
                break;

            case "INSERT":
                finalSql = buildInsert(payload);
                break;

            case "UPDATE":
                finalSql = buildUpdate(payload);
                break;

            case "DELETE":
                finalSql = buildDelete(payload);
                break;

            default:
                return res.status(400).json({ success: false, message: "Unknown action" });
        }

        const result = await executeSql(api_key, { sql: finalSql, params: payload.params || [] });
        return res.status(result.success ? 200 : 400).json(result);

    } catch (err) {
        console.error("SQL Engine Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;