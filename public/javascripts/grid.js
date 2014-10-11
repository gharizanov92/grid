var gridModule = angular.module("grid", ['ui.bootstrap'], function($compileProvider) {
    // configure new 'compile' directive by passing a directive
    // factory function. The factory function injects the '$compile'
    $compileProvider.directive('compile', function($compile) {
        // directive factory creates a link function
        return function(scope, element, attrs) {
            scope.$watch(
                function(scope) {
                    // watch the 'compile' expression for changes
                    return scope.$eval(attrs.compile);
                },
                function(value) {
                    // when the 'compile' expression changes
                    // assign it into the current DOM
                    element.html(value);

                    // compile the new DOM and link it to the current
                    // scope.
                    // NOTE: we only compile .childNodes so that
                    // we don't get into infinite loop compiling ourselves
                    $compile(element.contents())(scope);
                }
            );
        };
    });
});

gridModule.directive('grid', function() {
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
        controller: function ($scope, $http, $element, $sce, $parse, $compile) {
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

            this.addColumn = function (column) {
                if(column.template == '') {
                    $scope.columns.push({
                        header: column.header,
                        width: column.width,
                        field: column.binding,
                        template:'{{row[column.field]}}'
                    });
                } else {
                    $scope.columns.push({
                        header: column.header,
                        width: column.width,
                        field: column.binding,
                        template:'<div>' + column.template + '</div>'
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
        },
        link:function(scope, element, attrs){
            scope.fetchData();
            console.log(scope.data);
            var rowtemplate = "";
            for(var column in scope.columns){
                rowtemplate += "<td>" + scope.columns[column].template + "</td>" + "\n";
            }
            scope.rowtemplate = rowtemplate;
        }
    };
});

gridModule.filter('unsafe', function($sce) {
    return function(val) {
        return $sce.trustAsHtml(val);
    };
});

gridModule.directive("column", function () {
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
            scope.template = element[0].innerHTML;
            grid.addColumn(scope);
        }
    };
});