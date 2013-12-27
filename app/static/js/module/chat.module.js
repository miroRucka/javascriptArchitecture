/**
 * module for chat editor. Its responsibility is validate message and send it to io.socket
 */
angular.module('chat.editor.module', []);
angular.module('chat.editor.module').directive('chatEditor', function (dataService) {
    return {
        restrict: 'E,A',
        scope: {},
        link: function (scope, element) {
            element.find('textarea').bind('keydown', function (e) {
                if (e.keyCode == 13) {
                    e.preventDefault();
                    if (!_.isEmpty(scope.message)) {
                        scope.submit();
                    }
                }
            });
        },
        controller: function ($scope) {
            $scope.message;
            $scope.clients;
            dataService.getClientsCount(function(data){
                $scope.clients = data;
                $scope.safeApply();
            });
            $scope.submit = function () {
                dataService.postMessage($scope.message);
                $scope.message = undefined;
            };
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
        },
        templateUrl: '/template/chatEditor.html'
    };
});

/**
 * module to render messages to chat board from data service
 */
angular.module('chat.messages.module', []);
angular.module('chat.messages.module').directive('chatMessages', function () {
    return {
        restrict: 'E,A',
        scope: {},
        controller: 'MessagesCtrl',
        templateUrl: '/template/messages.html'
    };
});

angular.module('chat.messages.module').controller('MessagesCtrl', function ($scope, $timeout, dataService) {
    var DEFAULT_ADMIN_MESSAGE = "Administrátor vymazal správu z ";
    var LIMIT = 10;
    $scope.messages = [];
    $scope.adminMessage = undefined;
    var _removeMessage = function (id) {
        _.each($scope.messages, function (message, index) {
            if (message._id === id) {
                $scope.messages.splice(index, 1);
                $scope.adminMessage = {
                    text: DEFAULT_ADMIN_MESSAGE,
                    time: message.timestamp
                };
            }
        });
    };
    var ok = function (messages) {
        $scope.messages = messages.data;
    };
    dataService.getMessages().then(ok);
    dataService.getNewMessage(function (data) {
        $scope.messages.unshift(data);
        if($scope.messages.length > LIMIT){
            $scope.messages.pop();
        }
        $scope.safeApply();
    });
    dataService.deleteMessageListener(function (data) {
        _removeMessage(data._id);
        $scope.safeApply();
    });
    var unbind = $scope.$watch("adminMessage", function (message) {
        if (!_.isUndefined(message)) {
            $timeout(function () {
                $scope.adminMessage = undefined;
            }, 5000);
        }
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
    $scope.$on('$destroy', function () {
        unbind();
    });
});

/**
 * this controller handle start and stop socket service
 */
angular.module('chat.editor.module').controller('MainChatCtrl', function ($scope, dataService) {
    dataService.connect();
    $scope.$on('$destroy', function () {
        dataService.disconnect();
    });
});

angular.module('chat.editor.module').filter('message', function () {
    return function (items) {
        if (!_.isUndefined(items) && _.isArray(items)) {
            return items.slice().reverse().slice(0, 10);
        } else {
            return items;
        }
    };
});
angular.module('chat.editor.module').filter('client', function () {
    return function (client) {
        if (!_.isUndefined(client) && client.length > 10) {
            return client.substring(0,8) + '...'
        } else {
            return client;
        }
    };
});