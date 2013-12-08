/**
 * data service find all messages for chat and post message to io.socket
 */
angular.module('data.service', []);
angular.module('data.service').service('dataService', function ($http) {

    var _PATH = '/';
    var _socket;

    var _getMessages = function () {
        return $http({
            method: 'GET',
            url: '/api/messages/'
        });
    };
    var _getNewMessage = function (listener) {
        if (!_.isUndefined(_socket) && !_.isUndefined(listener)) {
            _socket.on('receiveMessage', function (data) {
                listener(data);
            });
        } else {
            console.error('socket or listener is not defined!');
        }
    };
    var _postMessage = function (message) {
        if (!_.isUndefined(_socket)) {
            _socket.emit('postMessage', { message: message });
        } else {
            console.error('socket is not defined!');
        }
    };
    var _connect = function () {
        _socket = io.connect(_PATH);
        return _socket;
    };
    var _getSocketInstance = function () {
        if (!_.isUndefined(_socket)) {
            return _connect();
        }
        return _socket;
    };
    var _disconnect = function () {
        if (!_.isUndefined(_socket)) {
            _socket.disconnect();
            _socket = undefined;
        }
    };
    var _login = function (user, password) {
        var p = $.param({user: user, password: password});
        return $http({
            method: 'POST',
            url: '/login',
            data: p,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        });
    };

    //public api
    return {
        getMessages: _getMessages,
        postMessage: _postMessage,
        connect: _connect,
        disconnect: _disconnect,
        socketInstance: _getSocketInstance,
        getNewMessage: _getNewMessage,
        login: _login
    };
});