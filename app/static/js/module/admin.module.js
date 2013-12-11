angular.module('admin.module', ['data.service']);
angular.module('admin.module').controller('AdminCtrl', function ($scope, dataService) {
    $scope.messages = [];
    var ok = function (messages) {
        $scope.messages = messages.data;
    };
    dataService.getMessages().then(ok);
    $scope.deleteMessage = function(){

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