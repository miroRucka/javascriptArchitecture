/**
 * module for chat editor. Its responsibility is validate message and send it to io.socket
 */
angular.module('chat.editor.module', []);
angular.module('chat.editor.module').directive('chatEditor', function (dataService) {
    return {
        restrict:'E,A',
        scope:{},
        link:function (scope, element) {
            element.find('textarea').bind('keydown', function (e) {
                if (e.keyCode == 13) {
                    e.preventDefault();
                    if (!_.isEmpty(scope.message)) {
                        scope.submit();
                    }
                }
            });
        },
        controller:function ($scope) {
            $scope.message;
            $scope.submit = function () {
                dataService.postMessage($scope.message);
                $scope.message = undefined;
            }
        },
        templateUrl:'/template/chatEditor.html'
    };
});

/**
 * module to render messages to chat board from data service
 */
angular.module('chat.messages.module', []);
angular.module('chat.messages.module').directive('chatMessages', function () {
    return {
        restrict:'E,A',
        scope:{},
        controller:'MessagesCtrl',
        templateUrl:'/template/messages.html'
    };
});

angular.module('chat.messages.module').controller('MessagesCtrl', function ($scope, dataService) {
    $scope.messages = [];
    var ok = function (messages) {
        $scope.messages = messages.data;
    };
    dataService.getMessages().then(ok);
    dataService.getNewMessage(function (data) {
        $scope.messages.push(data);
        $scope.safeApply();
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