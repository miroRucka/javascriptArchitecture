angular.module('data.service', []);
angular.module('data.service').service('dataService', function($http) {
    var _getMessages = function(){
        return $http({
            method: 'GET',
            url : '/api/messages/'
        });
    };
    return {
        getMessages: _getMessages
    };
});