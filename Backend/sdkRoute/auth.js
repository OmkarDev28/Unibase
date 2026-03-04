import express from "express";
import { createUser } from "../utils/createUser.js";
import { loginWithUsername } from "../utils/loginWithUsername.js";

const router = express.Router();

router.post("/auth", async (req, res) => {
    const payload = req.body;
    const api_key = req.headers['ub-api-key'];
    const action = payload.action;

    try {
        let response;
        switch (action) {
            case "login_with_username":
                response = await loginWithUsername(api_key, payload);
                return res.status(response.success ? 200 : 400).json(response);
            
            case "create_user":
                response = await createUser(api_key, payload);
                return res.status(response.success ? 201 : 400).json(response);

            case "get_id":
                response = await getUserId(api_key, payload);
                return res.status(response.success ? 200 : 404).json(response);

            case "update_user":
                response = await updateUser(api_key, payload); 
                return res.status(response.success ? 200 : 400).json(response);

            default:
                return res.status(400).json({ success: false, message: "Invalid Auth Action" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Auth Error" });
    }
});

export default router;