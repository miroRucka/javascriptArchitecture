angular.module('login.module', [])
angular.module('login.module').controller('LoginCtrl', function ($scope, $location, dataService, Auth) {
    $scope.error;
    $scope.login = function () {
        var promise = dataService.login($scope.user, $scope.password);
        var ok = function (r) {
            if (!Boolean(r.data.success)) {
                setError();
                Auth.clear();
            } else {
                $scope.error = undefined;
                Auth.setUser({
                    logged: true,
                    name: r.data.username
                });
                $location.path('/admin');
            }
        };
        var err = function () {
            setError();
            Auth.clear();
        };
        var setError = function () {
            $scope.error = {
                message: 'Chyba pri prihlasovaní'
            };
        };
        promise.then(ok, err);
    };
});

angular.module('login.module').factory('Auth', function ($http) {
    var _user = {
        logged: false,
        name: undefined
    };
    var _clear = function () {
        _user.logged = false;
        _user.name = undefined;
    };
    var _authOnServer = function () {
        return $http({method: 'GET', url: '/auth'});
    };
    var _setUser = function(user){
        if (user !== undefined) {
            _user.logged = true;
            _user.name = user.name;
        } else {
            _clear();
        }
    };
    return {
        isLogged: function (cb) {
            if (_.isUndefined(_user.name)) {
                var ok = function (data) {
                    cb(Boolean(data.data.success));
                    if(Boolean(data.data.success)){
                        _setUser({
                            name: data.data.username
                        });
                    }else{
                       _clear();
                    }
                };
                var err = function () {
                    cb(false);
                };
                return _authOnServer().then(ok);
            }
            cb(_user.logged);
        },
        name: function () {
            return _user.name;
        },
        setUser: _setUser,
        clear: _clear
    }
});