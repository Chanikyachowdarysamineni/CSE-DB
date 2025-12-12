require('dotenv').config();
const mongoose = require('mongoose');

async function clearDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const collections = await mongoose.connection.db.collections();
    
    console.log('\nClearing all collections...\n');
    
    for (let collection of collections) {
      const name = collection.collectionName;
      const count = await collection.countDocuments();
      await collection.deleteMany({});
      console.log(`✅ Deleted ${count} documents from "${name}"`);
    }
    
    console.log('\n🎉 All data cleared successfully from database!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

clearDatabase();
