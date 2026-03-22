// ============================================
// Borrow & Reservations Controller
// ============================================

app.controller('BorrowCtrl', ['$scope', '$http', '$location', 'AuthService',
function($scope, $http, $location, AuthService) {
  $scope.records = [];
  $scope.loading = true;
  $scope.error = '';
  $scope.success = '';
  $scope.isAdmin = AuthService.isAdmin();
  $scope.statusFilter = '';
  $scope.showIssueForm = false;
  $scope.showReturnModal = false;
  $scope.returnResult = null;

  // Issue form data
  $scope.issueForm = {};
  $scope.members = [];
  $scope.books = [];
  $scope.recordToReturn = null;

  // Load records
  $scope.loadRecords = function() {
    $scope.loading = true;
    var url = API + '/borrow';
    var params = [];
    if ($scope.statusFilter) params.push('status=' + $scope.statusFilter);
    if (!$scope.isAdmin) params.push('member_id=' + AuthService.getUser().id);
    if (params.length) url += '?' + params.join('&');

    $http.get(url)
      .then(function(res) { $scope.records = res.data; })
      .catch(function() { $scope.error = 'Failed to load records.'; })
      .finally(function() { $scope.loading = false; });
  };

  $scope.loadRecords();

  $scope.filterBy = function(status) {
    $scope.statusFilter = status;
    $scope.loadRecords();
  };

  // Issue book form
  $scope.openIssueForm = function() {
    $scope.showIssueForm = true;
    $scope.issueForm = {};
    // Load members and books for dropdowns
    $http.get(API + '/members').then(function(res) { $scope.members = res.data; });
    $http.get(API + '/books').then(function(res) {
      $scope.books = res.data.filter(function(b) { return b.available_copies > 0; });
    });
  };

  $scope.closeIssueForm = function() { $scope.showIssueForm = false; };

  $scope.issueBook = function() {
    $scope.error = '';
    $scope.success = '';
    if (!$scope.issueForm.book_id || !$scope.issueForm.member_id) {
      $scope.error = 'Select both a book and a member.';
      return;
    }
    $http.post(API + '/borrow', $scope.issueForm)
      .then(function(res) {
        $scope.success = 'Book issued successfully!';
        $scope.showIssueForm = false;
        $scope.loadRecords();
      })
      .catch(function(err) { $scope.error = err.data ? err.data.error : 'Failed to issue.'; });
  };

  // Return book
  $scope.openReturnModal = function(record) {
    $scope.recordToReturn = record;
    $scope.showReturnModal = true;
    $scope.returnResult = null;
  };

  $scope.closeReturnModal = function() {
    $scope.showReturnModal = false;
    $scope.recordToReturn = null;
  };

  $scope.returnBook = function() {
    if (!$scope.recordToReturn) return;
    $http.put(API + '/borrow/' + $scope.recordToReturn.record_id + '/return')
      .then(function(res) {
        $scope.returnResult = res.data;
        $scope.loadRecords();
      })
      .catch(function(err) { $scope.error = err.data ? err.data.error : 'Failed to return.'; });
  };

  // Date formatting
  $scope.formatDate = function(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN');
  };
}]);

// Reservations Controller
app.controller('ReservationsCtrl', ['$scope', '$http', 'AuthService',
function($scope, $http, AuthService) {
  $scope.reservations = [];
  $scope.loading = true;
  $scope.error = '';
  $scope.success = '';
  $scope.isAdmin = AuthService.isAdmin();

  $scope.loadReservations = function() {
    $scope.loading = true;
    var url = API + '/reservations';
    if (!$scope.isAdmin) url += '?member_id=' + AuthService.getUser().id;
    $http.get(url)
      .then(function(res) { $scope.reservations = res.data; })
      .catch(function() { $scope.error = 'Failed to load reservations.'; })
      .finally(function() { $scope.loading = false; });
  };

  $scope.loadReservations();

  $scope.updateReservation = function(id, status) {
    $http.put(API + '/reservations/' + id, { status: status })
      .then(function() {
        $scope.success = 'Reservation ' + status + '.';
        $scope.loadReservations();
      })
      .catch(function(err) { $scope.error = err.data ? err.data.error : 'Failed to update.'; });
  };

  $scope.formatDate = function(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN');
  };
}]);
