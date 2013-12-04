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
        new Chat(msg).save(function (err, chat) {});
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


/**
 * configure express server
 */
app.use(express.logger('dev'));
app.use('/js', express.static(__dirname + '/static/js'));
app.use('/css', express.static(__dirname + '/static/css'));
app.use('/template', express.static(__dirname + '/views/template'));
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

app.get('/api/messages/', function (req, res) {
    dbOperation.findAll(function(data){
        res.json(data);
    });

});

io.sockets.on('connection', function (socket) {
    socket.emit('news', { hello:'world' });
    socket.on('postMessage', function (data) {
        var msg = {username:'Admin', message: data.message, timestamp: new Date()};
        dbOperation.save(msg);
        io.sockets.emit('receiveMessage', msg);
    });
});