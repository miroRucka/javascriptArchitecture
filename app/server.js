var express = require('express');
var cookie = require('express/node_modules/cookie');
var connect = require('express/node_modules/connect');
var mongoose = require('mongoose');
var app = express();
var http = require('http');
var server = http.createServer(app);
var sockjs = require('sockjs');
var passport = require('passport');
var Cryptr = require("cryptr");
var _ = require('underscore');
var LocalStrategy = require('passport-local').Strategy;
var SALT_WORK_FACTOR = 'x';
var MemoryStore = express.session.MemoryStore;
var sessionStore = new MemoryStore({ reapInterval: 60000 * 10 });
var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"};
var sockjs_echo = sockjs.createServer(sockjs_opts);
sockjs_echo.installHandlers(server, {prefix:'/echo'});

server.listen(process.env.VMC_APP_PORT || 8080);

var utils = (function () {
    var _exists = function (input) {
        return !_.isUndefined(input) && !_.isNull(input);
    };
    return {
        exists: _exists
    };
})();

var sessionOperation = (function (store) {
    var _getUser = function (sesId, done) {
        store.get(sesId, function (err, session) {
            if (!utils.exists(err) && !_.isUndefined(session) && !_.isUndefined(session.passport) && !_.isUndefined(session.passport.user)) {
                userId = session.passport.user;
                dbOperation.findUserById(userId, function (err, user) {
                    if (err) {
                        done(err);
                    } else {
                        done(null, user);
                    }
                });
            } else {
                done('ERR_USER_NOT_FOUND');
            }
        });
    };
    return {
        user: _getUser
    };
})(sessionStore);

var dbOperation = (function () {

    var chatSchema = mongoose.Schema({
        client: {
            name: String,
            ip: String
        },
        message: String,
        timestamp: Date
    });

    var Chat = mongoose.model('Chat', chatSchema);

    var localUserSchema = mongoose.Schema({
        username: { type: String, required: true, index: { unique: true } },
        //actually it is the hash
        password: { type: String, required: true },
        role: { type: String, required: true }
    });

    localUserSchema.pre('save', function (next) {
        var user = this;
        if (!user.isModified('password')) return next();
        var cryptr = new Cryptr(SALT_WORK_FACTOR);
        user.password = cryptr.encrypt(user.password);
        next();
    });

    localUserSchema.methods.comparePassword = function (candidatePassword, cb) {
        var cryptr = new Cryptr(SALT_WORK_FACTOR);
        cb(null, cryptr.decrypt(this.password) === candidatePassword);
    };

    var Users = mongoose.model('Users', localUserSchema);

    var _getMongoConfig = function () {
        if (process.env.VCAP_SERVICES) {
            var env = JSON.parse(process.env.VCAP_SERVICES);
            return env['mongodb-1.8'][0]['credentials'];
        }
        return {
            "hostname": "localhost",
            "port": 27017,
            "username": "",
            "password": "",
            "name": "",
            "db": "chat"
        }
    };

    var _mongoUrl = function () {
        var obj = _getMongoConfig();
        obj.hostname = (obj.hostname || 'localhost');
        obj.port = (obj.port || 27017);
        obj.db = (obj.db || 'test');
        if (obj.username && obj.password) {
            return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
        }
        else {
            return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
        }
    };

    var _connect = function () {
        return mongoose.connect(_mongoUrl());
    };

    var _saveMessage = function (msg) {
        new Chat(msg).save(function (err, chat) {
        });
    };

    /**
     * @param cb - callback it will be call after operation with result of select
     * @param limit - limit is count of messages in result, if it is undefined then method is finding all messages
     * @private
     * find chat messages -> order by timestamp newest will be first
     */
    var _findMessages = function (cb, limit) {
        Chat.find().limit(_.isUndefined(limit) ? 0 : limit).sort({timestamp: -1}).exec(function (err, chats) {
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

    var _saveUser = function (user, cb) {
        new Users(user).save(function (err, user) {
            cb(err, user);
        });
    };

    var _deleteChatMessage = function (id) {
        var query = Chat.remove({_id: id});
        query.exec();
    };

    return {
        connect: _connect,
        save: _saveMessage,
        findMessages: _findMessages,
        findUser: _findUser,
        findUserById: _findUserById,
        saveUser: _saveUser,
        deleteMessage: _deleteChatMessage
    }
})();

var db = dbOperation.connect();

//dbOperation.saveUser({username: 'pajla', password: 'a', role: 'ADMIN'});

/**
 * configure express server#
 */
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.urlencoded())
app.use(express.json())
app.use(express.session({ secret: 'SECRET', store: sessionStore }));
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


function auth(req, res, next, unAuth, role) {
    if (req.isAuthenticated() && hasRole(role, req.user)) {
        next();
    } else {
        unAuth();
    }
};

var hasRole = function (role, user) {
    if (_.isUndefined(role)) {
        return true;
    } else if (_.isArray(role)) {
        return !_.isUndefined(_.find(role, function (r) {
            return user.role === r
        }));
    } else {
        return user.role === role;
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
    dbOperation.findMessages(function (data) {
        res.json(data);
    }, 10);

});

app.get('/api/s/messages/', function (req, res) {
    auth(req, res, function () {
        dbOperation.findMessages(function (data) {
            res.json(data);
        }, undefined);
    }, function () {
        res.send(401);
    }, 'ADMIN');
});

/**
 * request for client authentication
 */
app.post('/auth', function (req, res) {
    auth(req, res, function () {
        if (utils.exists(req.user)) {
            res.send({ access: true, username: req.user.username, role: req.user.role });
        } else {
            res.send({ access: false });
        }
    }, function () {
        if (utils.exists(req.user)) {
            res.send({ access: false, username: req.user.username, role: req.user.role });
        } else {
            res.send({ access: false });
        }
    }, req.body.role);
});

app.delete('/api/message/:id', function (req, res) {
    auth(req, res, function () {
        dbOperation.deleteMessage(req.params.id);
        res.end();
        io.sockets.emit('deleteMessage', {_id: req.params.id});
    }, function () {
        res.send(401);
    });
});

app.post('/login', function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        if (utils.exists(err)) {
            return next(err);
        }
        if (!user) {
            res.send(401);
        }
        req.logIn(user, function (err) {
            if (utils.exists(err)) {
                return next(err);
            }
            return res.send({username: user.username, role: user.role });
        });

    })(req, res, next);
});

app.post('/singup', function (req, res, next) {
    var user = req.body.user;
    var password = req.body.password;
    var passwordRepeat = req.body.passwordRepeat;
    if (!utils.exists(user) || !utils.exists(password) || !utils.exists(passwordRepeat)) {
        res.send({ success: false, code: 'UNCOMPLETE_DATA' });
    } else if (password !== passwordRepeat) {
        res.send({ success: false, code: 'BAD_PASSWORD' });
    } else {
        dbOperation.saveUser({username: user, password: password, role: 'CHAT'}, function (err, user) {
            if (utils.exists(err)) {
                res.send({ success: false, code: 'ERROR', dbError: err });
            } else if (!utils.exists(user)) {
                res.send({ success: false, code: 'ERROR', dbError: err });
            } else {
                passport.authenticate('local', function (err, user, info) {
                    if (utils.exists(err)) {
                        return next(err);
                    }
                    if (!user) {
                        res.send(401);
                    }
                    req.logIn(user, function (err) {
                        if (utils.exists(err)) {
                            return next(err);
                        }
                        return res.send({success: true, username: user.username });
                    });

                })(req, res, next);
            }
        });
    }
});

app.get('/login', function (req, res) {
    res.render('login.html');
});

app.get('/logout', function (req, res) {
    req.logout();
    res.end();
});

//this should be a separate module for socket operation like post and recieving message
(function socket(db) {
    var _connected = [];
    var _createClient = function (socket, user) {
        return {
            socketId: socket.id,
            name: !_.isUndefined(user) ? user.username : socket.id,
            ip: !_.isUndefined(socket.handshake.address) ? socket.handshake.address.address : '',
            sessionId: !_.isUndefined(socket.handshake.sessionID) ? socket.handshake.sessionID : ''
        }
    };
    var _removeClient = function (id) {
        _.forEach(_connected, function (client, index) {
            if (id === client.socketId) {
                _connected.splice(index, 1);
            }
        });
    };


    sockjs_echo.on('connection', function (conn) {
        console.log('connect');
        conn.write('test');
    });
})(dbOperation);