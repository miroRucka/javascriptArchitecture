angular.module('admin.module', ['data.service']);
angular.module('admin.module').controller('AdminCtrl', function ($scope, dataService) {
    $scope.messages = [];
    var _removeMessage = function(id){
        _.each($scope.messages, function(message, index){
            if(message._id === id){
                $scope.messages.splice(index, 1);
            }
        });
    };
    var ok = function (messages) {
        $scope.messages = messages.data;
    };
    dataService.getMessagesSecure().then(ok);
    $scope.deleteMessage = function(id){
        dataService.deleteMessage(id);
    };
    dataService.connect();
    dataService.deleteMessageListener(function(data){
        _removeMessage(data._id);
        $scope.safeApply();
    });
    $scope.$on('$destroy', function () {
        dataService.disconnect();
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
angular.module('admin.module').filter('adminMessage', function(){
    return function (input) {
        if (!_.isUndefined(input) && input.length > 50) {
            return _.str.trim(input.substring(1,50) + ' ...');
        } else {
            return input;
        }

    };
});