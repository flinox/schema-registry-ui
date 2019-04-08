var angular = require('angular');
var angularAPP = angular.module('angularAPP');

var SubjectListCtrl = function ($scope, $rootScope, $log, $mdMedia, SchemaRegistryFactory, env) {

  $log.info("Starting schema-registry controller : list ( initializing subject cache )");

  function addCompatibilityValue() {
    angular.forEach($rootScope.allSchemas, function (schema) {
      SchemaRegistryFactory.getSubjectConfig(schema.subjectName).then(
        function success(config) {
          schema.compatibilityLevel = config.compatibilityLevel;
        },
        function errorCallback(response) {
          $log.error(response);
        });
    })
  }

  /*
   * Watch the 'newCreated' and update the subject-cache accordingly
   */

  $scope.$watch(function () {
    return $rootScope.listChanges;
  }, function (a) {
    if (a !== undefined && a === true) {
      loadCache(); //When new is created refresh the list
      $rootScope.listChanges = false;
    }
  }, true);
  // listen for the event in the relevant $scope
  $scope.$on('newEvolve', function (event, args) {
    loadCache();
  });

  $scope.$watch(function () {
    return env.getSelectedCluster().NAME;
  }, function (a) {
    $scope.cluster = env.getSelectedCluster().NAME;
    loadCache(); //When cluster change, reload the list
  }, true);
  /**
   * Load cache by fetching all latest subjects
   */
  function loadCache() {
    $rootScope.allSchemas = [];
    $rootScope.allNamespaces =[];
    var promise = SchemaRegistryFactory.refreshLatestSubjectsCACHE();
    promise.then(function (cachedData) {
      $rootScope.allSchemas = cachedData;


      // Flinox
      var allNamespaces = [{ namespace: "" }];
      angular.forEach($rootScope.allSchemas, function(value, key) {

        var exists = false;
        angular.forEach(allNamespaces, function(val2, key) {
          if(angular.equals(value.Schema.namespace, val2.namespace)){ exists = true }; 
        });

        if(exists == false && value.Schema.namespace != "") { 

          allNamespaces.push({ namespace: value.Schema.namespace }); 
          
        }

      });
      
      $rootScope.allNamespaces = allNamespaces;
      // Flinox

      addCompatibilityValue();
    }, function (reason) {
      $log.error('Failed at loadCache : ' + reason);
    }, function (update) {
      $log.debug('Got notification: ' + update);
    });
  }

  var itemsPerPage = (window.innerHeight - 355) / 48;
  Math.floor(itemsPerPage) < 3 ? $scope.itemsPerPage = 3 : $scope.itemsPerPage = Math.floor(itemsPerPage);
};

SubjectListCtrl.$inject = ['$scope', '$rootScope', '$log', '$mdMedia', 'SchemaRegistryFactory', 'env'];

angularAPP.controller('SubjectListCtrl', SubjectListCtrl);

//In small devices the list is hidden
// $scope.$mdMedia = $mdMedia;
// $scope.$watch(function () {
//   return $mdMedia('gt-sm');
// }, function (display) {
//   $rootScope.showList = display;
// });
