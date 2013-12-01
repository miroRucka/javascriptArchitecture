var express = require('express');
var mongoose = require('mongoose');
var config = require('./config');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

server.listen(config.port);

var dbOperation = (function () {

    var chatSchema = mongoose.Schema({
        username:String,
        message:String,
        timestamp: Date
    });

    var Chat = mongoose.model('Chat', chatSchema);

    var _connect = function () {
        return mongoose.connect(config.dbUrl);
    };

    var _saveMessage = function(msg){
        new Chat({username:'Admin', message: msg, timestamp: new Date()}).save(function (err, chat) {});
    };

    var _findAll = function(cb, err){
        Chat.find(function (err, chats) {
            cb(chats);
        });
    };

    return {
        connect: _connect,
        save: _saveMessage,
        findAll: _findAll
    }
})();
var db = dbOperation.connect();
dbOperation.findAll(function(d){
    console.log(d);
});

/**
 * configure express server
 */
app.use(express.logger('dev'));
app.use('/js', express.static(__dirname + '/static/js'));
app.use('/css', express.static(__dirname + '/static/css'));
app.use(express.favicon(__dirname + '/static/images/favicon.ico'));
app.set('views', __dirname + '/views');
app.use(app.router);
app.engine('html', require('ejs').renderFile);


/**
 * serve root
 */
app.get('/', function (req, res) {
    res.render('index.html');
});

io.sockets.on('connection', function (socket) {
    socket.emit('news', { hello:'world' });
    socket.on('postMessage', function (data) {
        console.log(data.message);
        dbOperation.save(data.message);
        io.sockets.emit('receiveMessage', {foo:"test.. "});
    });
});