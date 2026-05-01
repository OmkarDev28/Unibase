# Unibase 🚀

```Unibase - Backend-as-a-Service Engine```

**Unibase** is a powerful and lightweight Backend-as-a-Service (BaaS) engine built entirely in JavaScript. It is designed to accelerate development by providing out-of-the-box backend functionalities, allowing developers to focus on building great frontend experiences instead of reinventing the backend wheel.

```
Unibase/
├── Backend/          # Core backend engine logic, API routes, and services
├── web/              # Frontend/Admin dashboard to interact with the BaaS
├── server.js         # Main entry point for the Node.js backend server
├── package.json      # Project metadata and dependencies
├── .env.example      # Environment variables configuration template
└── .gitignore        # Ignored files (e.g., node_modules, .env)
```

📚 Unibase DocumentationWelcome to the official documentation for Unibase, the lightweight, JavaScript-powered Backend-as-a-Service engine. This guide covers the architecture, core modules, and API references needed to extend and deploy Unibase.

🏗️ 1. Architecture Overview  
Unibase is divided into two primary subsystems, ensuring a clean separation between the backend engine and the management interface.The Engine (/Backend & server.js): The core Node.js application responsible for handling API requests, managing database connections, routing, and executing business logic.The Dashboard (/web): A frontend web application used by administrators to visually manage database collections, users, API keys, and server settings without writing code.

⚙️ 2. Core Modules  
2.1 Authentication & AuthorizationUnibase provides built-in user management.JWT-based Auth: Issues JSON Web Tokens for secure stateless API communication.Role-Based Access Control (RBAC): Define roles (e.g., admin, user, guest) and restrict access to specific collections or endpoints based on these roles.  
2.2 Dynamic API GenerationAs a BaaS, Unibase dynamically generates RESTful endpoints based on your data models.CRUD Operations: Automatically creates Create, Read, Update, and Delete endpoints when a new collection is defined in the dashboard.Filtering & Pagination: Built-in query parsing to handle limits, offsets, and field filtering via URL parameters.  
2.3 Database AbstractionUnibase sits on top of your database to manage data seamlessly.Note: Update this section based on your specific database (e.g., MongoDB/Mongoose, PostgreSQL/Prisma).Schema Management: Define and validate data structures.Relationships: Support for linking different data collections.

📡 3. REST API Reference
Base URLAll
API requests should be prefixed with your server's domain and API version:http://localhost:<PORT>/api/v1  

Authentication Endpoints
```
Method                Endpoint            Description
POST                  /auth/register      Register a new user.
POST                  /auth/login         Authenticate and receive a JWT.
GET                   /auth/me            Get the profile of the currently logged-in user.  
```

Collection API (Dynamic)
When you create a collection (e.g., posts), Unibase exposes the following:  
```
Method                Endpoint                   Description                         Auth Required
GET                   /data/{collection}         Retrieve a list of documents.       Configurable
POST                  /data/{collection}         Create a new document.              Configurable
GET                   /data/{collection}/:id     Retrieve a single document by ID.   Configurable
PUT                   /data/{collection}/:id     Update an existing document.        Configurable
DELETE                /data/{collection}/:id     Delete a document.                  Admin
```
Example Request: Fetching Data
```
GET /api/v1/data/posts?status=published&limit=10
Authorization: Bearer <YOUR_JWT_TOKEN>
```
Example Response:
```
{
  "success": true,
  "data": [
    { "id": "1", "title": "Hello World", "status": "published" }
  ],
  "meta": {
    "total": 1,
    "limit": 10
  }
}
```

💻 4. Dashboard Usage (/web)The Unibase Web Dashboard provides a GUI to manage your BaaS.Start the Dashboard: Run npm start inside the /web directory.Login: Use your initial Admin credentials (configured in .env).Manage Collections: Navigate to the "Database" tab to visually create new tables/collections.View Logs: Check real-time API request logs and error monitoring.

🛠️ 5. Configuration (Environment Variables)Unibase relies heavily on environment variables for security and configuration. Ensure your .env file contains the following (adjust as needed for your project):
```
Code snippet# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_URI=mongodb://localhost:27017/unibase
# Or for SQL: DB_URI=postgresql://user:password@localhost:5432/unibase

# Security
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

🚀 6. DeploymentTo deploy Unibase to a production environment (like Render, Heroku, or an AWS EC2 instance):Ensure NODE_ENV=production is set.Set up your production database and update the DB_URI.Build the frontend dashboard (if it uses React/Vue):  
```
cd web
npm run build
```
Serve the dashboard via the backend Express server or deploy it separately to a CDN (like Vercel or Netlify).
Start the backend using a process manager like PM2:   
```
pm2 start server.js --name "unibase-engine"
```

📝 License
Distributed under the MIT License. See LICENSE for more information.

👥 Authors & Contributors
* **OmkarDev28**
* **BhArAtbK-alt** 

**Note**
```
Feel free to update the `Features` and `Environment Variables` sections with the exact details of the database (e.g., MongoDB/PostgreSQL) and the frameworks (e.g., React, Express) you actually implemented in your specific `package.json`!
```

