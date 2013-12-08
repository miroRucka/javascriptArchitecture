var chatApp = angular.module('chat-app', ['ngAnimate', 'ngRoute', 'data.service', 'chat.editor.module', 'chat.messages.module', 'login.module']);

chatApp.directive('nav', function () {
    return {
        restrict: 'A',
        scope: false,
        link: function (scope, elm) {
            elm.find('a').bind('click', function (e) {
                elm.find('li').removeClass('active');
                $(e.target).parent().addClass('active');
            });
        }
    }
});

/**
 * configures application routes
 */
chatApp.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
            when('/', {
                controller: 'MainChatCtrl',
                templateUrl: '/template/chatTmpl.html',
            }).when('/login', {
                controller: 'LoginCtrl',
                templateUrl: '/template/loginTmpl.html',
            }).when('/test', {
                controller: function (user, $location) {
                    if (!Boolean(user.isLogged())) {
                        $location.path('/login');
                    }
                },
                templateUrl: '/template/adminMessages.html',
            }).
            otherwise({
                redirectTo: '/'
            });
    }]);

