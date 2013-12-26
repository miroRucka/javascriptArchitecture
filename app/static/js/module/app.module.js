var chatApp = angular.module('chat-app', ['ngAnimate', 'ngRoute', 'data.service', 'chat.editor.module', 'chat.messages.module', 'login.module','singup.module', 'admin.module']);

chatApp.run(function ($rootScope, $location, Auth) {

    // enumerate routes that need authentication
    var routesThatDontRequireAuth = ['/admin'];

    // check if current location matches route
    var toAuth = function (route) {
        return _.find(routesThatDontRequireAuth,
            function (toAuthRoutes) {
                return _.str.startsWith(route, toAuthRoutes);
            });
    };

    $rootScope.$on('$routeChangeStart', function (event, next, current) {
        // if route requires auth and user is not logged in
        if (toAuth($location.url())) {
            Auth.isLogged(function (logged) {
                if (!Boolean(logged)) {
                    $location.path('/login');
                }
            });
        }
    });
});

/**
 * configures application routes
 */
chatApp.config(function ($routeProvider) {
    $routeProvider.
        when('/', {
            controller: 'MainChatCtrl',
            templateUrl: '/template/chatTmpl.html'
        }).when('/login', {
            controller: 'LoginCtrl',
            templateUrl: '/template/loginTmpl.html'
        }).when('/admin', {
            controller: 'AdminCtrl',
            templateUrl: '/template/adminMessages.html'
        }).when('/singup', {
            controller: 'SingUpCtrl',
            templateUrl: '/template/singupTmpl.html'
        }).
        otherwise({
            redirectTo: '/'
        });
});

chatApp.config(function ($httpProvider) {

    var logsOutUserOn401 = function ($q, $location) {
        var success = function (response) {
            if (!_.isUndefined(response.data) && !_.isUndefined(response.data.access) && !Boolean(response.data.access)) {
                $location.path('/login');
                return $q.reject(response);
            }
            return response;
        };

        var error = function (response) {
            if (response.status === 401) {
                //redirect them back to login page
                $location.path('/login');
                return $q.reject(response);
            }
            else {
                return $q.reject(response);
            }
        };

        return function (promise) {
            return promise.then(success, error);
        };
    };

    $httpProvider.responseInterceptors.push(logsOutUserOn401);
});

chatApp.directive('nav', function (Auth, $location, $window) {
    return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attrs) {
            var clazz = attrs.nav;
            var path = element.find('a').attr('href');
            scope.location = $location;
            scope.$watch('location.path()', function (newPath) {
                if (path === "#" + newPath) {
                    element.addClass(clazz);
                } else {
                    element.removeClass(clazz);
                }
            });
            scope.$on('$destroy', function () {
                element.removeClass(clazz);
            });
        }
    }
});

chatApp.directive('navBar', function (Auth) {
    return {
        restrict: 'A',
        scope: false,
        link: function(scope, elm, attr){
            $(elm).find('li').show();
        },
        controller: function ($scope) {
            $scope.isLogged;
            $scope.role;
            var _exposeLogin = function(logged){
                if(!Boolean(logged)){
                    $scope.isLogged = logged;
                    $scope.role = undefined;
                }else{
                    $scope.isLogged = true;
                    $scope.role = logged.role;
                }
            };
            $scope.isAdminLogged = function(){
                return $scope.isLogged && $scope.role === 'ADMIN';
            };
            $scope.logout = function () {
                Auth.logout();
            };
            Auth.isLogged(function (logged) {
                _exposeLogin(logged);
            }, null);
            Auth.pushListener({
                id: 'nav',
                action: function (logged) {
                    _exposeLogin(logged);
                    $scope.safeApply();
                }
            });
            $scope.$on('$destroy', function () {
                Auth.removeListener('nav');
            });
            $scope.safeApply = function (fn) {
                var phase = this.$root.$$phase;
                if (phase == '$apply' || phase == '$digest') {
                    if (fn && ( typeof (fn) === 'function')) {
                        fn();
                    }
                } else {
                    this.$apply(fn);
                }
            };
        }
    }
});

