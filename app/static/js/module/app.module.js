var chatApp = angular.module('chat-app', ['ngRoute', 'data.service', 'chat.editor.module', 'chat.messages.module']);
chatApp.run(function () {
    console.log('start apllication');
});

/**
 * configures application routes
 */
chatApp.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
            when('/phones', {
                templateUrl: 'partials/phone-list.html',
                controller: 'PhoneListCtrl'
            }).
            when('/phones/:phoneId', {
                templateUrl: 'partials/phone-detail.html',
                controller: 'PhoneDetailCtrl'
            }).
            otherwise({
                redirectTo: '/phones'
            });
    }]);

