var amqp = require('amqplib/callback_api');
const rabbitUrl = 'amqp://192.168.1.168';
const opt = { credentials: require('amqplib').credentials.plain('test', 'test') }

function sendRabbitMQ(queueName, data) {
    amqp.connect(rabbitUrl, opt, function (error0, connection) {
        if (error0) {
            throw error0;
        }
        connection.createChannel(function (error1, channel) {
            if (error1) {
                throw error1;
            }

            var queue = queueName;

            channel.assertQueue(queue, {
                durable: false
            });
            channel.sendToQueue(queue, Buffer.from(data));

            console.log(" [x] Sent %s", data);
        });
        setTimeout(function () {
            connection.close();
        }, 500);
    });
}

module.exports = sendRabbitMQ;