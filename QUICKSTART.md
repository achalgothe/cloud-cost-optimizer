# Quick Start Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher, or MongoDB Atlas account)
- **npm** or **yarn**

## Installation

### 1. Install Dependencies

```bash
# Install all dependencies (backend + frontend)
npm run install-all
```

### 2. Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Make sure MongoDB is running locally on port 27017
# The default connection string is: mongodb://localhost:27017/cloud-cost-optimizer
```

**Option B: MongoDB Atlas (Cloud)**
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get your connection string
4. Update `.env` file with your connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cloud-cost-optimizer
   ```

### 3. Seed the Database

```bash
# This creates a demo user and sample data
npm run seed
```

### 4. Start the Application

```bash
# Start both backend and frontend in development mode
npm run dev
```

The application will start:
- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:3000

## Demo Login

After seeding the database, use these credentials:
- **Email**: `demo@cloudoptimizer.com`
- **Password**: `password123`

## Project Structure

```
cloud-cost-optimizer/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── context/       # React context (Auth)
│       ├── pages/         # Page components
│       ├── services/      # API services
│       └── utils/         # Utility functions
├── server/
│   ├── config/           # Database configuration
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Auth middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   └── seeder.js         # Database seeder
├── .env                  # Environment variables
├── .env.example          # Example environment file
└── package.json          # Root package.json
```

## Available Scripts

```bash
# Development
npm run dev          # Start both frontend and backend
npm run server       # Start backend only
npm run client       # Start frontend only

# Production
npm run build        # Build frontend for production
npm start            # Start production server

# Database
npm run seed         # Seed database with demo data
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Costs
- `GET /api/costs/overview` - Get cost overview
- `GET /api/costs/breakdown` - Get cost breakdown
- `GET /api/costs/forecast` - Get cost forecast

### Recommendations
- `GET /api/recommendations` - Get all recommendations
- `POST /api/recommendations/generate` - Generate AI recommendations
- `PUT /api/recommendations/:id` - Update recommendation
- `DELETE /api/recommendations/:id` - Delete recommendation

### Resources
- `GET /api/resources` - Get all resources
- `POST /api/resources/scan` - Scan/import resources
- `GET /api/resources/:id` - Get single resource
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource

### Budgets
- `GET /api/budgets` - Get all budgets
- `GET /api/budgets/:id` - Get single budget
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

## Features

### Dashboard
- Real-time cost overview
- Cost trends and analytics
- Provider breakdown
- Top spending services

### AI Recommendations
- Rightsizing suggestions
- Idle resource detection
- Reserved instance recommendations
- Savings plan optimization
- Storage optimization tips

### Resource Management
- Multi-cloud resource inventory
- Utilization tracking
- Status monitoring
- Cost attribution

### Budget Management
- Set budgets per provider
- Configurable alert thresholds
- Spend tracking
- Budget forecasting

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running:
```bash
# On Linux/Mac
sudo systemctl start mongod

# Or start manually
mongod --dbpath /data/db
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change the port in `.env`:
```
PORT=5001
```

### Frontend Build Issues
```bash
# Clear cache and reinstall
cd client
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. **Configure Cloud Providers**: Add your AWS, Azure, or GCP credentials to `.env`
2. **Customize Settings**: Update company name, alerts, and preferences
3. **Import Real Data**: Use the resource scan API to import your actual cloud resources
4. **Set Up Alerts**: Configure budget alerts and notifications

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review API documentation in the server/routes folder
- Inspect browser console for frontend errors
- Check server logs for backend errors
