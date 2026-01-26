import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  const dbUrl = process.env.DATABASE_URL || '';
  
  if (!dbUrl) {
    console.error('DATABASE_URL is not set in .env file');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(dbUrl, {
      serverSelectionTimeoutMS: 5000,
    });
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('Connection successful');
    console.log(`Found ${collections.length} collections`);
    if (collections.length > 0) {
      console.log('Collections:', collections.map(c => c.name).join(', '));
    }
  } catch (error) {
    console.error('Connection failed:', error.message);
    
    if (error.message?.includes("authentication failed")) {
      console.error('Verify username and password in DATABASE_URL');
    } else if (error.message?.includes("IP")) {
      console.error('IP address not whitelisted in MongoDB Atlas');
    }
    
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

testConnection();

