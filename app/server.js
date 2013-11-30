var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
server.listen(80);

app.configure(function () {
    app.use(express.logger('dev'));
    app.use('/js', express.static(__dirname + '/static'));
    app.set('views',__dirname + '/views');
    app.use(app.router);
    app.engine('html', require('ejs').renderFile);
});

app.get('/', function (req, res) {
    res.render('test1.html');
});

io.sockets.on('connection', function (socket) {
    socket.emit('news', { hello:'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});