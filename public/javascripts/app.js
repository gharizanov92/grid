/**
 * Created by gharizanov on 23.9.2014 г..
 */
var app = angular.module("app", ['ui.bootstrap']);

app.controller("controller", ["$scope", "$http", function($scope, $http){
    $scope.massage = "Hello World!";

    $scope.fetchData = function(pageSize, currentPage, result){
        $http({method: 'GET', url: '/books/' + pageSize + "/" + currentPage}).
            success(function(data) {
                result(data);
            });
    }
}]);

