// ============================================
// Fines Controller
// ============================================

app.controller('FinesCtrl', ['$scope', '$http', 'AuthService',
function($scope, $http, AuthService) {
  $scope.fines = [];
  $scope.loading = true;
  $scope.error = '';
  $scope.success = '';
  $scope.isAdmin = AuthService.isAdmin();
  $scope.showUnpaidOnly = false;

  $scope.loadFines = function() {
    $scope.loading = true;
    var url = API + '/fines';
    var params = [];
    if (!$scope.isAdmin) params.push('member_id=' + AuthService.getUser().id);
    if ($scope.showUnpaidOnly) params.push('unpaid=true');
    if (params.length) url += '?' + params.join('&');

    $http.get(url)
      .then(function(res) { $scope.fines = res.data; })
      .catch(function() { $scope.error = 'Failed to load fines.'; })
      .finally(function() { $scope.loading = false; });
  };

  $scope.loadFines();

  $scope.toggleUnpaid = function() {
    $scope.showUnpaidOnly = !$scope.showUnpaidOnly;
    $scope.loadFines();
  };

  $scope.payFine = function(fineId) {
    $http.put(API + '/fines/' + fineId + '/pay')
      .then(function() {
        $scope.success = 'Fine marked as paid.';
        $scope.loadFines();
      })
      .catch(function(err) { $scope.error = err.data ? err.data.error : 'Failed to pay.'; });
  };

  $scope.totalOutstanding = function() {
    return $scope.fines.filter(function(f) { return !f.paid; })
      .reduce(function(sum, f) { return sum + parseFloat(f.amount); }, 0);
  };

  $scope.totalCollected = function() {
    return $scope.fines.filter(function(f) { return f.paid; })
      .reduce(function(sum, f) { return sum + parseFloat(f.amount); }, 0);
  };

  $scope.formatDate = function(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN');
  };
}]);
