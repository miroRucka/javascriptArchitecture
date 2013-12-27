angular.module('login.module', [])
angular.module('login.module').controller('LoginCtrl', function ($scope, $location, dataService, Auth) {
    $scope.error;
    $scope.login = function () {
        var promise = dataService.login($scope.user, $scope.password);
        var ok = function (r) {
            $scope.error = undefined;
            if (r.data.role === 'ADMIN') {
                $location.path('/admin');
            } else {
                $location.path('/chat');
                Auth.isLogged(function () {
                }, 'CHAT');
            }
        };
        var err = function () {
            setError();
        };
        var setError = function () {
            $scope.error = {
                message: 'Chyba pri prihlasovaní'
            };
        };
        promise.then(ok, err);
    };
});

angular.module('login.module').factory('Auth', function ($http, dataService) {
    var _authListeners = [];
    var _isLogged = function (cb, role) {
        var ok = function (data) {
            var principal = {
                username: data.data.username,
                role: data.data.role,
                access: data.data.access
            };
            cb(principal);
            _publish(principal);
        };
        var err = function () {
            cb({
                access: false
            });
        };
        return _authOnServer(role).then(ok, err);
    };
    var _authOnServer = function (role) {
        return $http({method: 'POST', url: '/auth', data: {role: role}});
    };
    var _pushListener = function (listener) {
        _authListeners.push(listener);
    };
    var _removeListener = function (id) {
        _.each(_authListeners, function (listener, index) {
            if (id === listener.id) {
                _authListeners.splice(index, 1);
            }
        });
    };
    var _publish = function (principal) {
        _.each(_authListeners, function (listener) {
            listener.action.call(null, principal);
        });
    };
    var _logout = function () {
        var promise = dataService.logout();
        promise.then(function () {
            _publish({
                access: false
            });
        });
    };
    return {
        isLogged: _isLogged,
        logout: _logout,
        pushListener: _pushListener,
        removeListener: _removeListener
    }
});