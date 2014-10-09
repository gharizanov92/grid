var mongoose = require('mongoose');

var BookSchema = new mongoose.Schema({
    _id: String,
    ISBN: String,
    productId: String,
    datePublished: String,
    EAN: String,
    bookTitle: String,
    bookCover: String,
    url: String,
    pages: String
});

mongoose.model('Book', BookSchema);