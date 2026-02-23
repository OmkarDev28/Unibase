import express from "express";
import createProjectRoute from './projectRoutes/createProject.js';
import sendSqlReqRoute from './sqlRoute/sendSqlReq.js';
import sendSdkReqRoute from './sdkRoute/sendSdkReq.js';
import "dotenv/config";





const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());


app.use('/api', createProjectRoute);
app.use('/api', sendSdkReqRoute)
app.use('/api', sendSqlReqRoute);

// Web routes
import authRoutes from './web/authRoutes/authRoutes.js';

app.use('/api', authRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

