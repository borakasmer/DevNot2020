var config = {
    port: 3000,
    secret: 'secret',

    redisConfAcompany: {
        host: '192.168.1.168', // The redis's ACompany server ip 
        port: '6379'
    },

    redisConfBcompany: {
        host: '192.168.1.7', // The redis's BCompany server ip 
        port: '6379'
    }
};
module.exports = config;