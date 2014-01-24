/**
 * data service find all messages for chat and post message to io.socket
 */
angular.module('data.service', []);
angular.module('data.service').service('dataService', function ($http) {

    var _PATH = '/echo';
    var _socket;

    var _doInSocket = function (socketJob) {
        if (!_.isUndefined(_socket)) {
            socketJob(_socket);
        } else {
            console.error('socket is not defined!');
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

    };
    var _postMessage = function (message) {

    };
    var _getClientsCount = function (listener) {

    }
    var _connect = function () {
        if (!_.isUndefined(_socket)) {
        } else {
            _socket = new SockJS(_PATH);
        }
        return _socket;
    };
    var _getSocketInstance = function () {
        if (!_.isUndefined(_socket)) {
            return _connect();
        }
        return _socket;
    };
    var _disconnect = function () {

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
        if (!_.isUndefined(_socket)) {

        } else {
            console.error('socket is not defined!');
        }
    };
    //public api
    return {
        getMessages: _getMessages,
        getMessagesSecure: _getMessagesSecure,
        postMessage: _postMessage,
        connect: _connect,
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