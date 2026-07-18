require('../config/db'); // imports db.js which runs dns.setServers
const dns = require('dns/promises');

const run = async () => {
  try {
    console.log('Current DNS servers after db.js import:', dns.getServers());
    
    console.log('Resolving cluster0.lt1fnjb.mongodb.net...');
    // Atlas connection string typically uses SRV, which does a TXT lookup under the hood, but let's test lookup/resolve
    const resDb = await dns.resolve('cluster0.lt1fnjb.mongodb.net').catch(e => e.message);
    console.log('Result:', resDb);

    console.log('Resolving generativelanguage.googleapis.com...');
    const resAi = await dns.resolve('generativelanguage.googleapis.com').catch(e => e.message);
    console.log('Result:', resAi);
  } catch (err) {
    console.error(err);
  }
};

run();
