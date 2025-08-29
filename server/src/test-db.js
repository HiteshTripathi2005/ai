// Test script to verify MongoDB connection and basic functionality
import connectDB from './config/database.js';
import User from './models/User.js';

const testDB = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connected successfully');

    // Test user creation (commented out to avoid creating test users)
    // const testUser = await User.create({
    //   name: 'Test User',
    //   email: 'test@example.com',
    //   password: 'testpassword123'
    // });
    // console.log('✅ Test user created:', testUser.name);

    // Test user query
    const userCount = await User.countDocuments();
    console.log(`✅ Users in database: ${userCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
};

testDB();
