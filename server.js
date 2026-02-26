import express from "express";
import cors from "cors";

import sendSqlReqRoute from './Backend/sqlRoute/sendSqlReq.js';
import sendSdkReqRoute from './Backend/sdkRoute/sendSdkReq.js';
import "dotenv/config";





const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());


app.use(express.json());


app.use('/api', sendSdkReqRoute)
app.use('/api', sendSqlReqRoute);

app.get("/health", (req, res) => {
    res.status(200).json({ status: "Engine is alive", timestamp: new Date() });
});

// Web routes
import authRoutes from './web/routes/authRoutes.js';
import projectRoutes from './web/routes/projectRoutes.js';

app.use('/api/internal', authRoutes);
app.use('/api/internal', projectRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

