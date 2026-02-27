# Installation Instructions

## Option 1: Using MongoDB Atlas (Recommended - Free Cloud Database)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a free cluster (M0 Sandbox)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Update `.env` file:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/cloud-cost-optimizer
   ```
7. Run the setup commands:
   ```bash
   npm run seed
   npm run dev
   ```

## Option 2: Install MongoDB Locally

### On Ubuntu/Debian:
```bash
# Import MongoDB public key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify it's running
sudo systemctl status mongod
```

### On macOS (with Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Using Docker (Easiest):
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Then run:
```bash
npm run seed
npm run dev
```

## Option 3: Use Mock Data (No Database Required)

For testing without MongoDB, you can modify the backend to use in-memory data. See `server/mock-data.js` for details.

## Demo Credentials

After seeding:
- **Email**: demo@cloudoptimizer.com
- **Password**: password123
