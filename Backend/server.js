import express from "express";
import authRoutes from './authRoutes/authRoutes.js';
import createUserRoute from './authRoutes/createUser.js';
import createProjectRoute from './projectRoutes/createProject.js';
import "dotenv/config";


const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', createUserRoute);
app.use('/api', createProjectRoute);


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

