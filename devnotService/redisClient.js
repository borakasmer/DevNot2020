//Redis
var redis = require('redis');
const client = redis.createClient(); //creates a new client

//Redis Connect
client.on('connect', function () {
    console.log('Redis client bağlandı');
});
 
client.on('error', function (err) {
    console.log('Redis Clientda bir hata var ' + err);
});

module.exports = client;