//Express
var express = require("express");

//Mongoose
var mongoose = require("mongoose");

//Redis
const redisClient = require('./redisClient');

//Mongo
const mongoClient = require('./mongo');

//News Schema
var newsSchema = require('./news_schema');

//Enable Cors
var cors = require("cors");
var app = express();
app.use(cors());

//bodyParser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

//RabbitMQ
const sendRabbitMQ = require('./rabbitMQ');

app.get('/news', function (req, res) {
    mongoClient.find(function (err, doc) {
        res.send(doc);
    })
})

app.get("/news/:newsId", function (req, res) { 
    //NewsID alınır.
    var newsId = req.params.newsId;
    //Redis'e bağlanılmış mı?
    if (redisClient.connected) {
        var newsKey = 'news:' + newsId;
        //Redisden Haber Kaydı Çekilir.
        redisClient.get(newsKey, function (err, news) {
            //Redisde Haber Kaydı yok ise.
            if (news == null) {        
                var query = { "NewsId": newsId };
                //MongoDB'den Haber Çekilir.
                //mongoClient.find(query, function (err, doc) {
                mongoClient.findOne(query, function (err, doc) {
                    var data = JSON.stringify(doc);
                    //Redis'e kayıt konur.
                    redisClient.set(newsKey, data, function (err, res) { });
                    redisClient.expire(newsKey, 300); //Expire Süresi 5 dakika                    
                    res.send(doc);
                })
            }
            //Redisde Haber Kaydı var ise.
            else {          
                var doc = JSON.parse(news)
                res.send(doc);
            }
        });
    }
    else {
        var query = { "NewsId": req.params.newsId };
        mongoClient.findOne(query, function (err, doc) {
            res.send(doc);
        })
    }
})

app.post('/updateNews', async (req, res) => {
    //console.log("data:" + stringify(req.body));
    try {
        var News = mongoose.model('News', newsSchema, 'news');
        var updateNews = new News(req.body);
        const news = await News.findOne({ NewsId: updateNews.NewsId });
        await news.updateOne(updateNews);

        //Send RabbitMQ
        sendRabbitMQ("newsChannel", JSON.stringify(updateNews));
        
        return res.status(200).json({ status: "succesfully update" });
    }
    catch (error) {
        res.status(500).send(error);
    }
})

app.listen(1923);