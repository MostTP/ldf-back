# Environment Variables Template

Copy these variables to your `.env` file in the `ldf/` directory.

## Required Variables

```bash
# Database (MongoDB)
# Local MongoDB:
# DATABASE_URL="mongodb://localhost:27017/ldf"
# MongoDB Atlas (recommended for production):
DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/ldf?retryWrites=true&w=majority"

# Application
NODE_ENV=development
PORT=4000

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Optional Variables

```bash
# Frontend
FRONTEND_URL=https://your-frontend-domain.com

# Payment Gateway - Flutterwave
FLUTTERWAVE_PUBLIC_KEY=your-flutterwave-public-key
FLUTTERWAVE_SECRET_KEY=your-flutterwave-secret-key
FLUTTERWAVE_SECRET_HASH=your-flutterwave-secret-hash

# Payment Gateway - Seerbit
SEERBIT_PUBLIC_KEY=your-seerbit-public-key
SEERBIT_SECRET_KEY=your-seerbit-secret-key
SEERBIT_WEBHOOK_SECRET=your-seerbit-webhook-secret
```

## Getting Your MongoDB Connection String

### Local MongoDB
```bash
DATABASE_URL="mongodb://localhost:27017/ldf"
```

### MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Select your cluster
3. Click "Connect"
4. Choose "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database password
7. Replace `<dbname>` with `ldf`

See [MONGODB_SETUP.md](../MONGODB_SETUP.md) for detailed setup instructions.


