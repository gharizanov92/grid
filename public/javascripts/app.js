/**
 * Created by gharizanov on 23.9.2014 г..
 */
var app = angular.module("app", ['grid']);

app.controller("controller", ["$scope", "$http", function($scope, $http){
    $scope.fetchData = function(pageSize, currentPage, result){
        $http({method: 'GET', url: '/books/' + pageSize + "/" + currentPage}).
            success(function(data) {
                result(data);
            });
    };
    $scope.update = function(arg){
        console.log(arg);
    }
}]);

