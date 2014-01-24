/**
 * data service find all messages for chat and post message to io.socket
 */
angular.module('data.service', []);
angular.module('data.service').service('dataService', function ($http, $timeout) {

    var _PATH = '/echo';
    var _socket;

    var _socketEvents = {};

    var _doInSocket = function (socketJob) {
        if (!_.isUndefined(_socket)) {
            socketJob(_socket);
        } else {
            console.warn('socket is not defined!');
        }
    };

    var _getMessages = function () {
        return $http({
            method: 'GET',
            url: '/api/messages/'
        });
    };
    var _getMessagesSecure = function () {
        return $http({
            method: 'GET',
            url: '/api/s/messages/'
        });
    };
    var _getNewMessage = function (listener) {
        _doInSocket(function(_socket){
            if(_.isUndefined(_socketEvents['receiveMessage'])){
                _socketEvents.receiveMessage = function(data){
                    listener(data);
                }
            }
        });
    };
    var _postMessage = function (message) {
        _socket.send(message);
    };
    var _getClientsCount = function (listener) {
        _doInSocket(function(_socket){
            if(_.isUndefined(_socketEvents['clientsCount'])){
                _socketEvents.clientsCount = function(data){
                    listener(data);
                }
            }
        });
    };
    var _connect = function () {
        if (_.isUndefined(_socket)) {
            _socket = new SockJS(_PATH);
            _socket.onmessage = function(stream){
                var data = $.parseJSON(stream.data);
                if(_.isFunction(_socketEvents[data.event])){
                    _socketEvents[data.event](data.data);
                }
            };
            _socket.onopen = function(){
                if(_.isFunction(_socketEvents['connect'])){
                    _socketEvents['connect']();
                }
            };
        }
        return _socket;
    };
    var _onConnect = function(listener){
        _doInSocket(function(_socket){
            if(_.isUndefined(_socketEvents['connect'])){
                _socketEvents.connect = function(){
                    listener();
                }
            }
        });
    };
    var _getSocketInstance = function () {
        if (!_.isUndefined(_socket)) {
            return _connect();
        }
        return _socket;
    };
    var _disconnect = function () {
        if(_socket){
            _socket.close();
        }
        _socketEvents = {};
        _socket = undefined;
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
    var _singup = function (user, password, passwordRepeat) {
        var p = $.param({user: user, password: password, passwordRepeat: passwordRepeat});
        return $http({
            method: 'POST',
            url: '/singup',
            data: p,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        });
    };
    var _logout = function () {
        return $http({
            method: 'GET',
            url: '/logout/'
        });
    };
    var _deleteMessage = function (id) {
        return $http({
            method: 'DELETE',
            url: '/api/message/' + id
        });
    };
    var _deleteMessageListener = function (listener) {
        _doInSocket(function(socket){
            if(_.isUndefined(_socketEvents['deleteMessage'])){
                _socketEvents.deleteMessage = function(data){
                    listener(data);
                }
            }
        });
    };
    //public api
    return {
        getMessages: _getMessages,
        getMessagesSecure: _getMessagesSecure,
        postMessage: _postMessage,
        connect: _connect,
        onConnect: _onConnect,
        disconnect: _disconnect,
        socketInstance: _getSocketInstance,
        getNewMessage: _getNewMessage,
        getClientsCount: _getClientsCount,
        login: _login,
        singup: _singup,
        logout: _logout,
        deleteMessage: _deleteMessage,
        deleteMessageListener: _deleteMessageListener,
    };
});