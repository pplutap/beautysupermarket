var beautyApp = angular.module('beautyApp')
    .controller('ProductListController', ['$scope', '$state','$location', 'productAPI', 'productService','usSpinnerService',
        function ($scope, $state, $location, productAPI, productService, usSpinnerService) {

            $scope.itemsPerPage = 10;
            $scope.currentPage = 1;
            $scope.maxSize = 5;
            //$scope.storeLimit = 10;
            //$scope.brandLimit = 10;
            $scope.brands = [];
            $scope.merchants = [];
            $scope.categories = [];
            var SearchQuery = {};
            var filters = [];
            var query = {};
            query.term = '';
            query.page = 1;
            query.rpp = 10;
            SearchQuery.query = query;
            SearchQuery.query.filters = filters;
            $scope.storeSelection = [];
            $scope.brandSelection = [];
            //$scope.categorySelection = ['13000'];
            $scope.categorySelection = [];

            /*
            $scope.incrementStoreLimit = function () {
                //console.log('incrementing store limit');
                $scope.storeLimit = $scope.merchant_arr.length;
            };
            $scope.decrementStoreLimit = function () {
                //console.log('decrementing store limit');
                $scope.storeLimit = 10;
            };

            $scope.incrementBrandLimit = function () {
                $scope.brandLimit = $scope.brands.length;
            };
            $scope.decrementBrandLimit = function () {
                $scope.brandLimit = 10;
            };
            */

            $scope.clearFilters = function () {
                $scope.storeSelection.length = 0;
                $scope.brandSelection.length = 0;
                $scope.categorySelection.length = 0;
                $scope.categorySelection.push('13000');
                filters.length = 0;
            }

            $scope.clearFilter = function (filterType) {
                if (filterType == 'merchant') {
                    console.log('removing merchant filters');
                    $scope.storeSelection.length = 0;
                    console.log('store selection:' + JSON.stringify($scope.storeSelection));
                    rebuildFilters();
                    //run new search
                    if ($scope.keyword)
                        query.term = $scope.keyword;
                    resetQuery();
                    //$scope.storeLimit = 10;
                    doSearch(SearchQuery);
                } else if (filterType == 'brand') {
                    console.log('removing brand filters');
                    $scope.brandSelection.length = 0;
                    console.log('brand selection:' + JSON.stringify($scope.brandSelection));
                    rebuildFilters();
                    //run new search
                    if ($scope.keyword)
                        query.term = $scope.keyword;
                    resetQuery();
                    //$scope.brandLimit = 10;
                    doSearch(SearchQuery);
                }
            };

            $scope.filter = function (filterId, filterType) {

                console.log('filter function called');
                var idx;
                if (filterType == 'brand') {
                    //check if brand filter already selected
                    idx = $scope.brandSelection.indexOf(filterId);

                    if (idx > -1) {
                        $scope.brandSelection.splice(idx, 1);
                    } else { // else is not selected so select it
                        $scope.brandSelection.push(filterId);
                    }
                } else if (filterType == 'merchant') {
                    //check if merchant filter already selected
                    idx = $scope.storeSelection.indexOf(filterId);

                    if (idx > -1) {
                        $scope.storeSelection.splice(idx, 1);
                    } else { // else is not selected so select it
                        $scope.storeSelection.push(filterId);
                    }
                } else if (filterType == 'category') {
                    $scope.categorySelection.length = 0;
                    $scope.categorySelection.push(filterId);
                }

                if ($scope.keyword)
                    query.term = $scope.keyword;

                query.page = 1;
                $scope.currentPage = 1;

                rebuildFilters();
                console.log('Filter SearchQuery:' + JSON.stringify(SearchQuery));
                doSearch(SearchQuery);
            }

            function rebuildFilters() {
                filters.length = 0;

                if ($scope.storeSelection.length > 0)
                    filters.push({
                        'filter': $scope.storeSelection.join(),
                        'filterType': 'merchant'
                    });

                if ($scope.brandSelection.length > 0)
                    filters.push({
                        'filter': $scope.brandSelection.join(),
                        'filterType': 'brand'
                    });

                if ($scope.categorySelection.length > 0)
                    filters.push({
                        'filter': $scope.categorySelection.join(),
                        'filterType': 'category'
                    });
            }

            $scope.search = function (q) {
                console.log('searching for: ' + q);
                query.term = q;
                query.page = 1;
                query.rpp = 10;
                $scope.keyword = query.term;
                $scope.currentPage = 1;
                $scope.clearFilters();
                doSearch(SearchQuery);
            };


            function doSearch(searchQuery) {
                console.log('hitting productAPI with query:' + JSON.stringify(searchQuery));
                $scope.startSpin();
                productAPI.fetchProducts(searchQuery).then(function (res) {
                    console.log('productAPI.fetchProducts returned data');
                    //need to check that some results were actually set before passing them to the scope
                    if(res.data.results){
                        $scope.products = res.data.results.products;
                        $scope.product_arr = res.data.results.products.product;
                        $scope.num_merchants = res.data.resources.merchants.count;
                        $scope.total = res.data.results.products.count;
                        $scope.totalItems = res.data.results.products.count;
                        $scope.merchants = res.data.resources.merchants;
                        $scope.merchant_arr = res.data.resources.merchants.merchant;
                        $scope.brands = res.data.resources.brands.brand;
                        $scope.prices = res.data.filters.filter;


                        console.log('merchant arr length:'+ $scope.merchant_arr.length);
                        $scope.context = res.data.resources.categories.context.category;
                        $scope.current = _.last($scope.context);
                        if(res.data.resources.categories.matches){
                            $scope.categories = res.data.resources.categories.matches.category;
                        }else{
                            //console.log('no matches found');
                            $scope.categories.length = 0;
                        }
                        productService.setMerchants(res.data.resources.merchants.merchant);

                        $scope.stopSpin();
                        $state.go('products.list');
                    }else{
                        $scope.stopSpin();
                        //$state.go('404');
                    }
                }, function (result){
                    console.log("The fetchProducts request failed with error " + result);
                    $scope.stopSpin();
                });
            }


            $scope.selectItem = function (product) {
                //use the productService to select the item
                productService.selectProduct(product);
                console.log('selected item:' + product.name);
                var url = '/products/' + product.id;
                $location.path(url);
            }

            $scope.reset = function () {
                resetQuery();
                $scope.clearFilters();
                doSearch(SearchQuery);
            }

            $scope.startSpin = function(){
                usSpinnerService.spin('spinner-1');
            }
            $scope.stopSpin = function(){
                usSpinnerService.stop('spinner-1');
            }

            function resetQuery(){
                console.log('resetting query');
                query.term = '';
                query.page = 1;
                query.rpp = 10;
                $scope.searchTerm = '';
                $scope.my_object = {};
                angular.copy($scope.my_object, $scope.searchTerm);
                $scope.setPage(1);
            }

            /*
            function buildCategoryTree(categories,matches){

                _.forEach(categories, function(category) {
                    category.hId = category.order+1;
                    category.pId = category.order;
                    delete category.order;
                });


                _.forEach(categories,function(category){
                    category.nodes = [];
                    if(category != _.last(categories)){
                        category.nodes.push(_.find(categories, { 'pId': category.hId }));
                    }else{
                        if (matches != undefined){
                            category.nodes = matches;
                        }
                    }
                    delete category.pId;
                    delete category.hId
                });

                var nodes = [];
                //push the second element - removing the 'all' category
                //categories[1].name = 'All';
                //nodes.push(categories[1]);
               // nodes.push(categories);
                //nodes = categories;
                console.log('category tree:'+JSON.stringify(categories));
                //console.log('node tree:'+JSON.stringify(nodes));
                //return nodes;

                return categories;
            }
            */

            /* Pagination logic */
            $scope.range = function () {
                var rangeSize = 5;
                var ret = [];
                var start;
                console.log('page count:' + $scope.pageCount());
                start = $scope.currentPage;
                console.log('start:' + start);
                if (start > $scope.pageCount() - rangeSize) {
                    start = $scope.pageCount() - rangeSize;
                    console.log('start:' + start);
                }

                if (start < 1) {
                    start = 1;
                }

                if (rangeSize > $scope.pageCount()) {
                    rangeSize = $scope.pageCount();
                }
                for (var i = start; i < start + rangeSize; i++) {
                    ret.push(i);
                }
                return ret;
            };

            $scope.prevPage = function () {
                if ($scope.currentPage > 1) {
                    $scope.currentPage--;
                }
            };

            $scope.prevPageDisabled = function () {
                return $scope.currentPage === 1 ? "disabled" : "";
            };

            $scope.nextPage = function () {
                if ($scope.currentPage < $scope.pageCount()) {
                    $scope.currentPage++;
                }
            };

            $scope.nextPageDisabled = function () {
                return $scope.currentPage === $scope.pageCount() ? "disabled" : "";
            };

            $scope.pageCount = function () {
                return Math.ceil($scope.total / $scope.itemsPerPage);
            };

            $scope.setPage = function (pageNo) {
                console.log('new page:'+pageNo);
                $scope.currentPage = pageNo;
            };

            $scope.pageChanged = function() {
                console.log('Page changed to: ' + $scope.currentPage);
            };

            $scope.$watch("currentPage", function (newValue, oldValue) {
                console.log('requesting page:' + newValue)
                query.page = newValue;
                console.log('requesting rpp:' + query.rpp)
                console.log('requesting keyword:' + query.term)
                doSearch(SearchQuery);
            });

            /* End pagination logic */
        }])
    .controller('ProductDetailController', ['$scope', 'product',
        function ($scope, product) {
            console.log('loaded product');
            $scope.product_info = product.info();
            $scope.product = $scope.product_info.product;
            $scope.merchants = $scope.product_info.merchants;
            //$scope.context = res.data.resources.categories.context.category;
            console.log('name:'+$scope.product_info.product.name);
  }])
    .controller('TermsController', ['$scope', '$routeParams',
  function ($scope, $routeParams) {

  }])
    .controller('AboutController', ['$scope', '$routeParams',
  function ($scope, $routeParams) {

  }])
    .controller('PrivacyController', ['$scope', '$routeParams',
  function ($scope, $routeParams) {

  }])
    .controller('CookiesController', ['$scope', '$routeParams',
  function ($scope, $routeParams) {

  }])
    .controller('ContactController', ['$scope', '$routeParams',
  function ($scope, $routeParams) {

  }]);

