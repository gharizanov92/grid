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
            $scope.data = undefined;
            $scope.headers = [];
            $scope.totalServerItems = 0;
            $scope.currentPage = 1;
            $scope.pageSize = 250;
            $scope.columns = [];
            var columnIndex = 0;
            this.addColumn = function (column) {
                if(column.template == '') {
                    $scope.columns.push({
                        header: column.header,
                        width: column.width,
                        field: column.binding,
                        //template:'{{row[column.field]}}'
                        template:'{{row' + '.' + column.binding + '}}'
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
                $scope.data = undefined;
                $scope.fetchData();
            });

            $http({method: 'GET', url: '/books/total'}).
                success(function(total) {
                    $scope.totalServerItems = total;
                });

            $scope.fetchData();
        },
        link:function(scope, element, attrs){
            var rowtemplate = "";
            for(var column in scope.columns){
                rowtemplate += "<td width='" + scope.columns[column].width + "'>" + scope.columns[column].template + "</td>" + "\n";
                /*rowtemplate += "<td>" + scope.columns[column].template + "</td>" + "\n";*/
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

gridModule.directive('resizable', function($document, $window) {
    return {
        transclude:true,
        template: '<div ng-transclude/>',
        scope : {},
        controller: function($scope, $element){
            var node = angular.element($element[0].offsetParent);
            var tableOffset = 0;
            var columnOffset = 0;

            $element.css({
                position: 'relative'
            });

            while(node[0] != undefined){
                tableOffset += node[0].offsetLeft;

                node = angular.element(node[0].offsetParent);
            }

            node = $element;
            while(node[0] != undefined){
                columnOffset += node[0].offsetLeft;
                node = angular.element(node[0].offsetParent);
            }

            $scope.tableOffset = tableOffset;
            $scope.columnOffset = columnOffset;
            $scope.startX = $window.screenLeft + $element[0].offsetLeft;
            $scope.min = 0;

            $scope.calculateColumnHeaderWidth = function(columnElement){
                var header = columnElement[0].children[0].children[0];
                return header.offsetWidth + header.offsetLeft * 2
            }

        },
        link:function(scope, element, attr){
            var startX = scope.startX;
            var canResize = false;
            var maxWidth = 0;
            var minWidth = 0;
            var currentWidth = 0;

            setTimeout(function() {
                //var previousColumn = angular.element(element[0].previousElementSibling);
                var previousColumn = element;
                if (previousColumn[0] != undefined) {
                    scope.min = scope.calculateColumnHeaderWidth(previousColumn);
                }
            }, 150);

            element.on('mousedown', function(event) {
                event.preventDefault();

                currentWidth = element[0].offsetWidth;
                maxWidth = angular.element(element[0].nextElementSibling)[0].offsetWidth + currentWidth;

                scope.canResize = false;

                var startX = $window.screenLeft + element[0].offsetLeft;
                var xpos = event.screenX - startX;
                if(xpos + scope.columnOffset > element[0].offsetWidth +scope.columnOffset - 10){
                    scope.canResize = true;
                } else {
                    scope.canResize = false;
                }

                $document.on('mousemove', mousemove);
                $document.on('mouseup', mouseup);
            });

            element.on('mousemove', function(event){
                var xpos = event.screenX - $window.screenLeft + element[0].offsetLeft;

                if( xpos > element[0].offsetWidth - 10){
                    element.css({
                        cursor: 'w-resize'
                    });
                    
                } else {
                    element.css({
                        cursor: 'auto'
                    });
                }
            });

            function mousemove(event) {
                x = event.screenX - startX - element[0].offsetLeft + scope.columnOffset;

                var nextColumnHeaderWidth = scope.calculateColumnHeaderWidth(angular.element(element[0].nextElementSibling));

                if(x > maxWidth  - nextColumnHeaderWidth){
                    x = maxWidth - nextColumnHeaderWidth;
                }

                if(x < scope.min){
                    x = scope.min;
                }

                if(scope.canResize){
                    element.css({
                        width: x + 'px'
                    });
                    angular.element(element[0].nextElementSibling).css({
                        width: maxWidth - x + 'px'
                    });
                }

                //scope.$apply();
            }

            function mouseup() {
                $document.off('mousemove', mousemove);
                $document.off('mouseup', mouseup);
                canResize = false;
            }
        }
    }
});