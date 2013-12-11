var express = require('express');
var mongoose = require('mongoose');
var config = require('./config');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var passport = require('passport');
var bcrypt = require('bcrypt-nodejs');
var _ = require('underscore');
var LocalStrategy = require('passport-local').Strategy;
var SALT_WORK_FACTOR = 10;

server.listen(config.port);

var utils = (function () {
    var _exists = function (input) {
        return !_.isUndefined(input) && !_.isNull(input);
    };
    return {
        exists: _exists
    };
})();

var dbOperation = (function () {

    var chatSchema = mongoose.Schema({
        username: String,
        message: String,
        timestamp: Date
    });

    var Chat = mongoose.model('Chat', chatSchema);

    var localUserSchema = mongoose.Schema({
        username: { type: String, required: true, index: { unique: true } },
        //actually it is the hash
        password: { type: String, required: true }
    });

    localUserSchema.pre('save', function (next) {
        var user = this;
        // only hash the password if it has been modified (or is new)
        if (!user.isModified('password')) return next();
        // generate a salt
        bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
            if (utils.exists(err)) {
                return next(err);
            }
            // hash the password along with our new salt
            bcrypt.hash(user.password, salt, undefined, function (err, hash) {
                if (utils.exists(err)) {
                    return next(err);
                }
                // override the cleartext password with the hashed one
                user.password = hash;
                next();
            });
        });
    });

    localUserSchema.methods.comparePassword = function (candidatePassword, cb) {
        bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
            if (utils.exists(err)) {
                return cb(err);
            }
            cb(null, isMatch);
        });
    };

    var Users = mongoose.model('Users', localUserSchema);

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
        Users.findOne({ username: username}, function (err, user) {
            cb(err, user);
            console.log(err);
            console.log(user);
        });
    };

    var _findUserById = function (id, cb) {
        Users.findById(id, function (err, user) {
            cb(err, user);
        });
    };

    var _saveUser = function (user) {
        new Users(user).save(function (err, user) {
            console.log(user)
            console.log(err);
        });
    };

    return {
        connect: _connect,
        save: _saveMessage,
        findAll: _findAll,
        findUser: _findUser,
        findUserById: _findUserById,
        saveUser: _saveUser
    }
})();

var db = dbOperation.connect();

/**
 * configure express server#
 */
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.urlencoded())
app.use(express.json())
app.use(express.session({ secret: 'SECRET' }));
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
        if (utils.exists(err)) {
            return done(err);
        }
        if (!utils.exists(user)) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        user.comparePassword(password, function (err, isMatch) {
            if (utils.exists(err) || !Boolean(isMatch)) {
                done(null, false, { message: 'Incorrect password.' });
            } else {
                done(null, user);
            }

        });
    });
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


function auth(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.send({access: false});
    }
};

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

app.get('/api/s/messages/', function (req, res) {
    auth(req, res, function () {
        dbOperation.findAll(function (data) {
            res.json(data);
        });
    });
});

/**
 * request for client authentication
 */
app.get('/auth', function (req, res) {
    auth(req, res, function () {
        if (utils.exists(req.user)) {
            res.send({ success: true, username: req.user.username });
        } else {
            res.send({access: false});
        }
    });
});

app.post('/login', function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        if (utils.exists(err)) {
            return next(err);
        }
        if (!user) {
            return res.send({ success: false });
        }
        req.logIn(user, function (err) {
            if (utils.exists(err)) {
                return next(err);
            }
            return res.send({ success: true, username: user.username });
        });

    })(req, res, next);
});

app.get('/login', function (req, res) {
    res.render('login.html');
});

app.get('/logout', function (req, res) {
    req.logout();
    res.end();
});

io.sockets.on('connection', function (socket) {
    console.log('client connected!')
    socket.on('postMessage', function (data) {
        var msg = {username: 'Admin', message: data.message, timestamp: new Date()};
        dbOperation.save(msg);
        io.sockets.emit('receiveMessage', msg);
    });
    socket.on('disconnect', function() {
        console.log('Got disconnect!');
    });
});