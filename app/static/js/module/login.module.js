angular.module('login.module', [])
angular.module('login.module').controller('LoginCtrl', function ($scope, dataService, user) {
    $scope.error;
    $scope.login = function () {
        var promise = dataService.login($scope.user, $scope.password);
        var ok = function (r) {
            if (!Boolean(r.data.success)) {
                setError();
                user.clear();
            } else {
                $scope.error = undefined;
                user.setUser({
                    logged : true,
                    name: r.data.username
                });
            }
        };
        var err = function () {
            setError();
            user.clear();
        };
        var setError = function () {
            $scope.error = {
                message: 'Chyba pri prihlasovaní'
            };
        };
        promise.then(ok, err);
    };
});

angular.module('login.module').factory('user', function () {
    var _user = {
        logged: false,
        name: undefined
    };
    var _clear = function () {
        _user.logged = false;
        _user.name = undefined;
    };
    return {
        isLogged: function () {
            return _user.logged;
        },
        name: function() {
            return _user.name;
        },
        setUser: function (user) {
            if (user !== undefined) {
                _user.logged = true;
                _user.name = user.name;
            } else {
                _clear();
            }
        },
        clear: _clear
    }
});