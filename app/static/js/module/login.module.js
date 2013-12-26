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
                Auth.isLogged(function(){}, 'CHAT');
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
        role = role || 'ADMIN'
        var ok = function (data) {
            cb({
                username: data.data.username,
                role: data.data.role
            });
            _publish({
                username: data.data.username,
                role: data.data.role
            });
        };
        var err = function () {
            cb(false);
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
    var _publish = function (type) {
        _.each(_authListeners, function (listener) {
            listener.action.call(null, type);
        });
    };
    var _logout = function () {
        var promise = dataService.logout();
        promise.then(function () {
            _publish(undefined);
        });
    };
    return {
        isLogged: _isLogged,
        logout: _logout,
        pushListener: _pushListener,
        removeListener: _removeListener
    }
});