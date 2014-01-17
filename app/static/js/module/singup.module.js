angular.module('singup.module', []);
angular.module('singup.module').controller('SingUpCtrl', function ($scope, $location, dataService, Auth) {
    var _erroCodes = {
        BAD_NAME: 'Registrácia sa nepodarila, zlé meno.',
        BAD_PASSWORD: 'Registrácia sa nepodarila, heslá nie sú rovnaké.',
        UNCOMPLETE_DATA: 'Registrácia sa nepodarila, vyplnte všetky polia.',
        ERROR: 'Registrácia sa nepodarila.'
    };
    $scope.error;
    $scope.singup = function () {
        var promise = dataService.singup($scope.user, $scope.password, $scope.passwordRepeat);
        var ok = function (r) {
            if(!Boolean(r.data.success)){
                setError(r.data.code);
            }else {
                $scope.error = undefined;
                $location.path('/chat');
                Auth.isLogged();
            }
        };
        var err = function () {
            setError('ERROR');
        };
        var setError = function (code) {
            $scope.error = _erroCodes[code];
        };
        promise.then(ok, err);
    };
});