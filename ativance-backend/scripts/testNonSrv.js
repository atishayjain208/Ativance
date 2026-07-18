const mongoose = require('mongoose');

const run = async () => {
  const uri = 'mongodb://jainatishay208_db_user:Fk9E4lqOBexFXqSB@' +
              'ac-ghl4o5p-shard-00-00.lt1fnjb.mongodb.net:27017,' +
              'ac-ghl4o5p-shard-00-01.lt1fnjb.mongodb.net:27017,' +
              'ac-ghl4o5p-shard-00-02.lt1fnjb.mongodb.net:27017' +
              '/ativance?ssl=true&replicaSet=atlas-zw9s8x-shard-0&authSource=admin';

  try {
    console.log('Testing exact non-SRV connection...');
    await mongoose.connect(uri);
    console.log('Success! Connected to MongoDB Atlas.');
  } catch (err) {
    console.error('Connection failed:');
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
};

run();
