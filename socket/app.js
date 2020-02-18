const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

//RabbitMQ
var amqp = require('amqplib/callback_api');
const rabbitUrl = 'amqp://192.168.1.168';
const opt = { credentials: require('amqplib').credentials.plain('test', 'test') }

//Redis
const redisClient = require('./redisClient');

// Güncellenen Data'nın tüm bağlı clientlara gönderilmesi için atanan Socket.
//var socket = io.of('/');

io.on('connection', (socket) => {
    console.log(`User Socket Connected - ${socket.id}`);

    socket.on("disconnect", () => {
        console.log(`${socket.id} User disconnected.`)
    });
});

server.listen(1453);

newsModel = {
    NewsId: Number,
    Title: String,
    Detail: String,
    CreatedDate: Date,
    Image: String,
    Isdelete: Boolean
}

amqp.connect(rabbitUrl, opt, function (error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function (error1, channel) {
        if (error1) {
            throw error1;
        }
        var queue = 'newsChannel';

        channel.assertQueue(queue, {
            durable: false
        });

        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

        channel.consume(queue, function (data) {
            updateNews = JSON.parse(data.content.toString())
            console.log(" [x] Received News:", updateNews.Title + " - " + updateNews.CreatedDate);
            //socket.emit("updatedNews", updateNews);            
            io.emit("updatedNews", updateNews);
            if (redisClient.clientACompany.connected) {
                var newsKey = 'news:' + updateNews.NewsId;
                //Redisde Haber Varsa Güncellenir..Değilse Kaydedilir.
                redisClient.clientACompany.set(newsKey, JSON.stringify(updateNews), function (err, res) { });
            }
            if (redisClient.clientBCompany.connected) {
                var newsKey = 'news:' + updateNews.NewsId;
                //Redisde Haber Varsa Güncellenir..Değilse Kaydedilir.
                redisClient.clientBCompany.set(newsKey, JSON.stringify(updateNews), function (err, res) { });
            }
        }, {
            noAck: true
        });
    });
});