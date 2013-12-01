var express = require('express');
var mongoose = require('mongoose');
var config = require('./config');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
server.listen(config.port);

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

/**
 * configure socket.io
 */
io.sockets.on('connection', function (socket) {
    socket.emit('news', { hello:'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});

var db = mongoose.connect('mongodb://localhost/chat');

var chatSchema = mongoose.Schema({
    username:String,
    message:String
})


var Chat = mongoose.model('Chat', chatSchema);

new Chat({username:'webstorm', message:'hi from nodejs!'}).save(function (err, chat) {

});

Chat.find(function (err, chats) {
    console.info(chats);
});

