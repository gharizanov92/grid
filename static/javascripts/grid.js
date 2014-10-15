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
        template: '<div style="width: {{width}}"><div style="width: {{width}}; height:{{height}}; overflow:scroll"><table class="table table-striped table-hover table-bordered table-condensed table-responsive" style="table-layout: fixed;"><thead><tr><th id="column" ng-repeat="column in columns" style="width:{{column.width}}" resizable><span style="cursor: pointer" ng-bind = "column.header"/></th></tr></thead><tbody><tr ng-repeat = "row in data" compile="rowtemplate" style="overflow-wrap: break-word;"></tr></tbody></table></div><pagination style="float:right" total-items="totalServerItems" ng-model="currentPage" max-size="10" class="pagination-sm" boundary-links="true" rotate="false" num-pages="totalPages" items-per-page="pageSize"></pagination><img ng-if="!data" src="/images/loading.gif"/><div ng-transclude/></div>',
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

            $scope.totalServerItems = 8000;

            $scope.fetchData();
        },
        link:function(scope, element, attrs){
            var rowtemplate = "";
            for(var column in scope.columns){
                rowtemplate += "<td width='" + scope.columns[column].width + "' style=\"white-space: nowrap;overflow: hidden;text-overflow: ellipsis\">" + scope.columns[column].template + "</td>" + "\n";
                /*rowtemplate += "<td>" + scope.columns[column].template + "</td>" + "\n";*/
            }
            scope.rowtemplate = rowtemplate;
        }
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

gridModule.directive('resizable', function($document, $window){
    return {
        scope: {},
        controller: function($scope, $element, $compile){
            
            var width = $element[0].offsetWidth;
            var parent = angular.element($element[0].parentElement);
            $scope.handle = angular.element("<div style='float:right'></div>");  

            //executes when document is ready
            setTimeout(function(){
                    var header = $element[0].children[0];
                    $scope.minWidth = header.offsetWidth + header.offsetLeft * 2 + 10;
                    $scope.nextElementSibling = angular.element($element[0].nextElementSibling);
                    $scope.nextElementSiblingWidth = 0;
                    if($scope.nextElementSibling[0] != undefined){
                        $scope.nextElementSiblingWidth = $scope.nextElementSibling[0].children[0].offsetWidth + $scope.nextElementSibling[0].children[0].offsetLeft * 2 + 11;
                    }
                    $scope.handle.css({
                        display:"inline-block",
                        /*border: "1px solid red",*/
                        cursor: 'w-resize',
                        "margin-top": -header.offsetTop + 1 + 'px',
                        "margin-bottom": -header.offsetTop + 1 + 'px',
                        "margin-right": -header.offsetLeft * 2 + 1 + 'px',
                        height: header.offsetHeight + header.offsetTop * 2 + 'px',
                        width: "11px"
                    });
                    
                    $element.append($scope.handle);
                    $compile($scope.handle)($scope);
                });
        },
        link: function(scope, element){
            var startX = 0;
            var maxWidth = 0;
            var initialWidth = 0;
            var isResizing = false;
            var nextColumnHeaderWidth = 0;

            angular.element(scope.handle).on('mousedown', function(event) {
                event.preventDefault();
                startX = event.screenX;
                initialWidth = element[0].offsetWidth;
                maxWidth = scope.nextElementSibling[0].offsetWidth + initialWidth;

                $document.on('mousemove', mousemove);
                $document.on('mouseup', mouseup);
            });

            function mousemove(event) {
                x = event.screenX - startX;
                var newWidth = initialWidth + x;
                
                if(newWidth < scope.minWidth){
                    newWidth = scope.minWidth;
                }

                if(newWidth > maxWidth - scope.nextElementSiblingWidth){
                    newWidth = maxWidth - scope.nextElementSiblingWidth;
                }

                element.css({
                    width:newWidth + 'px'
                });

                scope.nextElementSibling.css({
                    width: maxWidth - newWidth + 'px'
                });
            }

            function mouseup() {
                $document.off('mousemove', mousemove);
                $document.off('mouseup', mouseup);
                scope.isResizing = false;
            }
        }
    }
})