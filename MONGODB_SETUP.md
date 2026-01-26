# MongoDB Setup Guide

This guide will help you set up MongoDB for the LDF project using Mongoose.

## 📋 Prerequisites

1. MongoDB installed locally OR a MongoDB Atlas account
2. Node.js and npm installed
3. Mongoose installed (`npm install mongoose`)

## 🚀 Option 1: Local MongoDB Setup

### Step 1: Install MongoDB

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

**Windows:**
Download and install from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

### Step 2: Verify MongoDB is Running

```bash
# Check if MongoDB is running
mongosh
# or
mongo
```

If connected, you'll see the MongoDB shell prompt.

### Step 3: Configure Connection String

In your `ldf/.env` file:

```bash
DATABASE_URL="mongodb://localhost:27017/ldf"
```

Or with authentication:
```bash
DATABASE_URL="mongodb://username:password@localhost:27017/ldf?authSource=admin"
```

## ☁️ Option 2: MongoDB Atlas Setup (Recommended for Production)

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (Free tier M0 is available)

### Step 2: Configure Database Access

1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Create a username and password (save these!)
5. Set user privileges to **"Atlas admin"** or **"Read and write to any database"**
6. Click **"Add User"**

### Step 3: Configure Network Access

1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. For development, click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. For production, add specific IP addresses
5. Click **"Confirm"**

### Step 4: Get Connection String

1. Go to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `ldf` (or your preferred database name)

**Example connection string:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ldf?retryWrites=true&w=majority
```

### Step 5: Configure Environment Variables

In your `ldf/.env` file:

```bash
DATABASE_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ldf?retryWrites=true&w=majority"
```

## ⚙️ Step 3: Install Dependencies

```bash
cd ldf
npm install
```

This will install Mongoose and other dependencies.

## ✅ Step 4: Test Connection

Test your database connection:

```bash
cd ldf
node scripts/test-connection.js
```

You should see:
```
✅ Connection successful!
✅ Query test successful
```

## 🌱 Step 5: Seed Database

Seed the database with an agent and coupon:

```bash
cd ldf
npm run seed
```

Expected output:
```
🌱 Starting database seed...
👤 Creating agent user...
✅ Agent created successfully!
🎫 Creating coupon for agent...
✅ Coupon created successfully!
✅ Seed completed successfully!
```

## 📝 Environment Variables Template

Create a `.env` file in the `ldf/` directory:

```bash
# Database (MongoDB)
# Local MongoDB:
# DATABASE_URL="mongodb://localhost:27017/ldf"
# MongoDB Atlas:
DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/ldf?retryWrites=true&w=majority"

# Application
NODE_ENV=development
PORT=4000

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend
FRONTEND_URL=https://your-frontend-domain.com

# Payment Gateways
FLUTTERWAVE_PUBLIC_KEY=your-key
FLUTTERWAVE_SECRET_KEY=your-key
FLUTTERWAVE_SECRET_HASH=your-hash

SEERBIT_PUBLIC_KEY=your-key
SEERBIT_SECRET_KEY=your-key
SEERBIT_WEBHOOK_SECRET=your-secret
```

## 🔧 Troubleshooting

### Connection Issues

1. **"MongooseServerSelectionError: connect ECONNREFUSED"**
   - MongoDB server is not running
   - Start MongoDB: `brew services start mongodb-community` (macOS) or `sudo systemctl start mongodb` (Linux)
   - Check if MongoDB is listening on port 27017

2. **"Authentication failed"**
   - Verify username and password in DATABASE_URL
   - Check database user credentials in MongoDB Atlas
   - Ensure user has proper permissions

3. **"IP not whitelisted" (MongoDB Atlas)**
   - Go to Network Access in MongoDB Atlas
   - Add your current IP address or use 0.0.0.0/0 for development

4. **"Connection timeout"**
   - Check network connectivity
   - Verify connection string is correct
   - For Atlas, ensure cluster is running (not paused)

### Model/Schema Issues

1. **"Model not found"**
   - Ensure models are imported correctly
   - Check model file paths
   - Verify Mongoose connection is established before using models

2. **"Validation errors"**
   - Check model schema definitions
   - Verify data matches schema requirements
   - Check required fields

## 🌐 Production Deployment

For production:

1. Use **MongoDB Atlas** (not local MongoDB)
2. Set `NODE_ENV=production`
3. Use strong, unique values for `JWT_SECRET`
4. Configure proper CORS with `FRONTEND_URL`
5. Whitelist only production server IPs in MongoDB Atlas
6. Use strong database passwords
7. Enable MongoDB Atlas monitoring and alerts

## 📚 Additional Resources

- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB University](https://university.mongodb.com/)

## 🔐 Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use different databases** for development and production
3. **Rotate credentials** regularly
4. **Use strong passwords** for database users
5. **Whitelist IPs** in production (don't use 0.0.0.0/0)
6. **Enable MongoDB Atlas encryption** at rest
7. **Use connection string with SSL** for Atlas (mongodb+srv://)

## 🔄 Migration from Prisma/PostgreSQL

If you're migrating from Prisma:

1. **Data Migration**: Export data from PostgreSQL and import to MongoDB
2. **Update Controllers**: Replace Prisma queries with Mongoose queries
3. **Update Models**: Use Mongoose schemas instead of Prisma models
4. **Update Services**: Replace Prisma client with Mongoose models

See the models in `ldf/models/` for Mongoose schema examples.

