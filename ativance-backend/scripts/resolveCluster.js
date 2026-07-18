const dns = require('dns/promises');

const run = async () => {
  try {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
    console.log('Resolving SRV records for _mongodb._tcp.cluster0.lt1fnjb.mongodb.net...');
    const srv = await dns.resolveSrv('_mongodb._tcp.cluster0.lt1fnjb.mongodb.net');
    console.log('SRV results:', srv);

    console.log('Resolving TXT records for cluster0.lt1fnjb.mongodb.net...');
    const txt = await dns.resolveTxt('cluster0.lt1fnjb.mongodb.net');
    console.log('TXT results (options/replicaSet):', txt);
  } catch (err) {
    console.error(err);
  }
};

run();
