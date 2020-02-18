var mongoose = require("mongoose");

var newsSchema = new mongoose.Schema({
    NewsId: Number,
    Title: String,
    Detail: String,
    CreatedDate: Date,
    Image: String,
    Isdelete: Boolean
});

module.exports = newsSchema;