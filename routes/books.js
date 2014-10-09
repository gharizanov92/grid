/**
 * Created by gharizanov on 23.9.2014 г..
 */

var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var book = mongoose.model('Book');

router.get('/:pageSize/:page', function(req, res, next) {
    var pageSize = req.params.pageSize;
    var page = req.params.page;
    book.find().skip(page * pageSize).limit(pageSize).exec(function(err, books){
        if(err){
            return next(err);
        }
        res.json(books);
    });
});

router.get('/total', function(req, res, next) {
    book.count(function(err, books){
        if(err){
            return next(err);
        }
        res.json(books);
    });
});

module.exports = router;