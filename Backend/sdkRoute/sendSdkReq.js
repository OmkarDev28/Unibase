import express from "express";
import pool from '../config/pg.js';
import { executeSql } from "../utils-sql/executeSql.js";
import { createUser } from "../utils/createUser.js";
import { loginWithUsername } from "../utils/loginWithUsername.js";


const router = express.Router();

router.post("/query", async (req, res) => {
    const payload = req.body;
    const api_key = req.headers['ub-api-key'];

    console.log(payload);
    

    
    

    let action = payload.action;
    let response, message;
        try {
            switch (action) {
                case "raw_sql":
                    console.log('asafdsd');
                    response = await executeSql(api_key, payload);
                    const status = response.success ? 200 : 400;
                    res.status(status).json(response); 
                    break;
                case "update_user":
                    response = await updateUser(api_key, payload);
                    res.status(response.success ? 200 : 400).json(response);
                    break;
                case "get_id":
                    const idResult = await getUserId(api_key, payload);
                    const idStatus = idResult.success ? 200 : 404;
                    res.status(idStatus).json(idResult);
                    break;
                case "login_with_username":
                    response = await loginWithUsername(api_key, payload);
                    const loginStatus = response.success ? 200 : 400;
                    res.status(loginStatus).json(response);
                    break;
                case "create_user":
                    response = await createUser(api_key, payload);
                    const createStatus = response.success ? 201 : 400; 
                    res.status(createStatus).json(response);
                    break;
                // ... more cases ...
                default:
                    // Code to execute if none of the cases match
                }
        
        
    
             
        } catch (err) {
            
            throw err;
        } 
});

export default router;