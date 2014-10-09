app.directive('grid', function() {
    return {
        restrict: 'E',
        templateUrl: 'javascripts/gridTemplate.html',
        scope: {
            url: '@',
            width: '@',
            height: '@',
            onDataRequested: '&'
        },
        replace: true,
        transclude: true,
        controller: function ($scope, $http, $element, $sce, $parse) {

            //inherit everything from parent scope
            var mergedScopes = {};
            angular.extend(mergedScopes, $scope.$parent);
            angular.extend(mergedScopes, $scope);
            angular.extend($scope, mergedScopes);

            $scope.fetchData = function(){
                $scope.onDataRequested()($scope.pageSize, $scope.currentPage, function(data){
                    $scope.data = data;
                });
            };

            $scope.hasNext = true;
            $scope.hasPrevious = true;
            $scope.data = [];
            $scope.headers = [];
            $scope.totalServerItems = 0;
            $scope.currentPage = 1;
            $scope.pageSize = 250;
            $scope.columns = [];

            for(var i = 0; i < 11; i++){
                $scope.headers.push("header " + (i + 1));
            }

            this.addColumn = function (column) {
                console.log(column);
                if(column.template == '') {
                    $scope.columns.push({
                        header: column.header,
                        width: column.width,
                        field: column.binding,
                        template:$sce.trustAsHtml('{{row[column.field]}}')
                    });
                } else {
                    $scope.columns.push({
                        header: column.header,
                        width: column.width,
                        field: column.binding,
                        template:$sce.trustAsHtml('<div>' + column.template + '</div>')
                    });
                }
            };

            $scope.$watch('currentPage', function(newValue, oldValue) {
                $scope.data = [];
                $scope.fetchData();
            });

            $http({method: 'GET', url: '/books/total'}).
                success(function(total) {
                    $scope.totalServerItems = total;
                });

            $scope.fetchData();
        }
    };
});

app.directive("column", function () {
    return {
        require: "^grid",
        restrict: "E",
        replace: true,
        transclude:true,
        template: '<div ng-hide="true" ng-click="click()" ng-transclude/>',
        scope: {
            binding: "@",
            width: "@",
            header: "@",
            click: '&'
        },
        link: function (scope, element, attrs, grid) {
            console.log(scope);
            scope.template = element[0].innerHTML;
            grid.addColumn(scope);
        }
    };
});