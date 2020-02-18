var mongoose = require("mongoose");
var newsSchema = require('./news_schema');

mongoose.connect('mongodb://127.0.0.1:27017/devnotnews', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
mongoose.set('useFindAndModify', false);
/* var newsSchema = new mongoose.Schema({
    NewsId: Number,
    Title: String,
    Detail: String,
    CreatedDate: Date,
    Image: String,
    Isdelete: Boolean
}); */

const mongoClint = mongoose.model('News', newsSchema, 'news');

module.exports = mongoClint;
