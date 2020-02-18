var config = require('./configRedis');
//Redis
var redis = require('redis');
const clientACompany = redis.createClient(config.redisConfAcompany); //creates a new client
const clientBCompany = redis.createClient(config.redisConfBcompany); //creates a new client

//Redis Connect
clientACompany.on('connect', function () {
    console.log('Redis ACompany client bağlandı');
});

clientACompany.on('error', function (err) {
    console.log('Redis ACompany Clientda bir hata var ' + err);
});

//Redis Connect
clientBCompany.on('connect', function () {
    console.log('Redis BCompany client bağlandı');
});

clientBCompany.on('error', function (err) {
    console.log('Redis BCompany Clientda bir hata var ' + err);
});

module.exports = { clientACompany, clientBCompany }