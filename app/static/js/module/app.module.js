var chatApp = angular.module('chat-app', ['ngAnimate', 'ngRoute', 'data.service', 'chat.editor.module', 'chat.messages.module']);


/**
 * configures application routes
 */
chatApp.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
            when('/', {
                controller: 'MainChatCtrl',
                templateUrl: '/template/chatTmpl.html'
            }).
            otherwise({
                redirectTo: '/'
            });
    }]);

