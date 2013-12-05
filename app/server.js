var express = require('express');
var mongoose = require('mongoose');
var config = require('./config');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var passport = require("passport");
var LocalStrategy = require('passport-local').Strategy;

server.listen(config.port);

var dbOperation = (function () {

    var chatSchema = mongoose.Schema({
        username:String,
        message:String,
        timestamp:Date
    });

    var Chat = mongoose.model('Chat', chatSchema);

    var localUserSchema = mongoose.Schema({
        username:String,
        salt:String,
        hash:String
    });

    var Users = mongoose.model('Userauths', localUserSchema);

    var _connect = function () {
        return mongoose.connect(config.dbUrl);
    };

    var _saveMessage = function (msg) {
        new Chat(msg).save(function (err, chat) {
        });
    };

    var _findAll = function (cb, err) {
        Chat.find(function (err, chats) {
            cb(chats);
        });
    };

    var _findUser = function (username, cb) {
        Users.findOne({ username:username}, function (err, user) {
            cb(err, user);
        });
    };

    var _findUserById = function (id, cb) {
        Users.findById(id, function (err, user) {
            cb(err, user);
        });
    };

    return {
        connect:_connect,
        save:_saveMessage,
        findAll:_findAll,
        findUser:_findUser,
        findUserById:_findUserById
    }
})();

var db = dbOperation.connect();


/**
 * configure express server
 */
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.urlencoded())
app.use(express.json())
app.use(express.session({ secret:'SECRET' }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/js', express.static(__dirname + '/static/js'));
app.use('/css', express.static(__dirname + '/static/css'));
app.use('/template', express.static(__dirname + '/views/template'));
app.use(express.favicon(__dirname + '/static/images/favicon.ico'));
app.set('views', __dirname + '/views');
app.use(app.router);
app.engine('html', require('ejs').renderFile);

/**
 * configure passport module, set strategies which app will be used
 */

passport.use(new LocalStrategy({ usernameField: 'user', passwordField: 'password' }, function (username, password, done) {
    dbOperation.findUser(username, function (err, user) {
        if (!err) {
            return done(err);
        }
        if (!user) {
            return done(null, false, { message:'Incorrect username.' });
        }

        hash(password, user.salt, function (err, hash) {
            if (err) {
                return done(err);
            }
            if (hash == user.hash) return done(null, user);
            done(null, false, { message:'Incorrect password.' });
        });
    })
}));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});


passport.deserializeUser(function (id, done) {
    dbOperation.findUserById(id, function (err, user) {
        if (err) {
            done(err);
        } else {
            done(null, user);
        }
    });
});

/**
 * serve root
 */
app.get('/', function (req, res) {
    res.render('index.html');
});

/**
 * rest API for list of chat messages
 */
app.get('/api/messages/', function (req, res) {
    dbOperation.findAll(function (data) {
        res.json(data);
    });

});

app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err); // will generate a 500 error
        }
        // Generate a JSON response reflecting authentication status
        if (! user) {
            return res.send({ success : false, message : 'authentication failed' });
        }
        return res.send({ success : true, message : 'authentication succeeded' });
    })(req, res, next);
});

app.get('/login', function (req, res) {
    res.render('login.html');
});

io.sockets.on('connection', function (socket) {
    socket.on('postMessage', function (data) {
        var msg = {username:'Admin', message:data.message, timestamp:new Date()};
        dbOperation.save(msg);
        io.sockets.emit('receiveMessage', msg);
    });
});