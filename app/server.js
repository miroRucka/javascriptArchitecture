var express = require('express');
var mongoose = require('mongoose/');
var config = require('./config');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
server.listen(config.port);

console.info(config);


app.use(express.logger('dev'));
app.use('/js', express.static(__dirname + '/static/js'));
app.use('/css', express.static(__dirname + '/static/css'));
app.use(express.favicon(__dirname + '/static/images/favicon.ico'));
app.set('views', __dirname + '/views');
app.use(app.router);
app.engine('html', require('ejs').renderFile);


app.get('/', function (req, res) {
    res.render('index.html');
});

io.sockets.on('connection', function (socket) {
    socket.emit('news', { hello:'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});