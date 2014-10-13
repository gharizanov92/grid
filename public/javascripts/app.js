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

    $scope.mockDataSource = function(pageSize, currentPage, result){
        var data = [];
        for(var i = 0; i < pageSize; i++){
            data.push({
                id: "id" + parseInt(Math.random()*10000),
                bookTitle: "Title " + parseInt(Math.random()*1000000000 + 1000000000),
                datePublished: parseInt(Math.random()*10 + 1) + "-" + parseInt(Math.random()*20 + 1) + "-" + parseInt(Math.random()*100 + 1914) + " г.",
                publisher: parseInt(Math.random()*10000),
                author: "Author " + parseInt(Math.random()*10000)
            });
        }
        result(data);
    };

    $scope.update = function(arg){
        console.log(arg);

    }
}]);

