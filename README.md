# AI-Powered Cloud Cost Optimizer

An intelligent cloud cost optimization platform that analyzes your cloud infrastructure spending across AWS, Azure, and GCP, providing AI-driven recommendations to reduce costs while maintaining performance.

## Features

- 📊 **Multi-Cloud Dashboard**: Unified view of costs across AWS, Azure, and GCP
- 🤖 **AI Recommendations**: Machine learning-powered cost optimization suggestions
- 📈 **Cost Analytics**: Real-time visualization of spending patterns
- 🔔 **Budget Alerts**: Configurable alerts for budget thresholds and cost spikes
- 📧 **Email/Slack Notifications**: Automatic alerts when budgets are exceeded
- 📋 **Resource Analysis**: Identify underutilized and idle resources
- 💰 **Savings Calculator**: Estimate potential savings from recommendations

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB for data persistence
- JWT Authentication
- AI/ML integration for recommendations

### Frontend
- React 18
- Material-UI (MUI)
- Recharts for data visualization
- Axios for API calls

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (optional - see Test Mode below)

### Quick Start (Test Mode - No Database Required)

```bash
# Install dependencies
npm run install-all

# Start in test mode (uses mock data)
npm run dev:test
```

Open http://localhost:3000 and login with any credentials (e.g., `demo@cloudoptimizer.com` / `password123`)

### Full Installation (With MongoDB)

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install

# Start the development server
npm run dev
```

### Configuration

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cloud-cost-optimizer
JWT_SECRET=your-secret-key
NODE_ENV=development

# Cloud Provider APIs (optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
GCP_PROJECT_ID=
GCP_CREDENTIALS=
```

## Project Structure

```
cloud-cost-optimizer/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── package.json
├── server/                 # Express backend
│   ├── controllers/       # Route controllers
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── middleware/        # Auth middleware
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Costs
- `GET /api/costs/overview` - Get cost overview
- `GET /api/costs/breakdown` - Get cost breakdown by service
- `GET /api/costs/forecast` - Get cost forecast

### Recommendations
- `GET /api/recommendations` - Get AI-powered recommendations
- `POST /api/recommendations/generate` - Generate new recommendations
- `PUT /api/recommendations/:id` - Update recommendation status
- `DELETE /api/recommendations/:id` - Delete recommendation

### Resources
- `GET /api/resources` - Get all resources
- `POST /api/resources/scan` - Trigger resource scan
- `GET /api/resources/:id` - Get single resource
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource

### Budgets
- `GET /api/budgets` - Get budget configurations
- `GET /api/budgets/:id` - Get single budget
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Alerts
- `POST /api/alerts/check-budgets` - Check budget thresholds
- `POST /api/alerts/detect-spikes` - Detect cost spikes
- `POST /api/alerts/monitor` - Run all monitoring
- `POST /api/alerts/test` - Send test alert
- `GET /api/alerts/history` - Get alert history
- `GET /api/alerts/settings` - Get alert settings
- `PUT /api/alerts/settings` - Update alert settings

## License

MIT
