angular.module('chat.editor.module', []);
angular.module('chat.editor.module').directive('chatEditor', function() {
    return {
        restrict : 'E,A',
        scope : {},
        controller : function(){

        },
        templateUrl: '/template/chatEditor.html'
    };
});

angular.module('chat.messages.module', []);
angular.module('chat.messages.module').directive('chatMessages', function() {
    return {
        restrict : 'E,A',
        scope : {},
        controller : 'MessagesCtrl',
        templateUrl: '/template/messages.html'
    };
});

angular.module('chat.messages.module').controller('MessagesCtrl', function($scope, dataService){
    $scope.messages = [];
    var ok = function(messages){
        $scope.messages = messages.data;
    };
    dataService.getMessages().then(ok);
});