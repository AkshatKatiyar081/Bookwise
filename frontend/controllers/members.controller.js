// ============================================
// Members Controller
// ============================================

app.controller('MembersCtrl', ['$scope', '$http', '$location',
function($scope, $http, $location) {
  $scope.members = [];
  $scope.searchQuery = '';
  $scope.loading = true;
  $scope.error = '';
  $scope.success = '';
  $scope.showAddModal = false;
  $scope.newMember = { membership_type: 'student' };

  $scope.loadMembers = function() {
    $scope.loading = true;
    $http.get(API + '/members')
      .then(function(res) { $scope.members = res.data; })
      .catch(function() { $scope.error = 'Failed to load members.'; })
      .finally(function() { $scope.loading = false; });
  };

  $scope.loadMembers();

  $scope.filteredMembers = function() {
    if (!$scope.searchQuery) return $scope.members;
    var q = $scope.searchQuery.toLowerCase();
    return $scope.members.filter(function(m) {
      return m.name.toLowerCase().indexOf(q) > -1 ||
             m.email.toLowerCase().indexOf(q) > -1;
    });
  };

  // Toggle member status
  $scope.toggleStatus = function(member) {
    var newStatus = member.status === 'active' ? 'suspended' : 'active';
    var data = angular.copy(member);
    data.status = newStatus;
    $http.put(API + '/members/' + member.member_id, data)
      .then(function() {
        member.status = newStatus;
        $scope.success = 'Member status updated.';
      })
      .catch(function(err) { $scope.error = err.data ? err.data.error : 'Failed to update.'; });
  };

  // Add member modal
  $scope.openAddModal = function() { $scope.showAddModal = true; $scope.newMember = { membership_type: 'student' }; };
  $scope.closeAddModal = function() { $scope.showAddModal = false; };

  $scope.addMember = function() {
    $scope.error = '';
    var m = $scope.newMember;
    if (!m.name || !m.email || !m.password) {
      $scope.error = 'Name, email, and password are required.';
      return;
    }
    $http.post(API + '/members', m)
      .then(function() {
        $scope.showAddModal = false;
        $scope.success = 'Member registered successfully!';
        $scope.loadMembers();
      })
      .catch(function(err) { $scope.error = err.data ? err.data.error : 'Failed to add member.'; });
  };
}]);

// Member Detail Controller
app.controller('MemberDetailCtrl', ['$scope', '$http', '$routeParams', 'AuthService',
function($scope, $http, $routeParams, AuthService) {
  $scope.member = null;
  $scope.loading = true;
  $scope.error = '';
  $scope.isAdmin = AuthService.isAdmin();

  $http.get(API + '/members/' + $routeParams.id)
    .then(function(res) { $scope.member = res.data; })
    .catch(function() { $scope.error = 'Member not found.'; })
    .finally(function() { $scope.loading = false; });
}]);

// Dashboard Controller
app.controller('DashboardCtrl', ['$scope', '$http', '$location',
function($scope, $http, $location) {
  $scope.stats = {};
  $scope.loading = true;
  $scope.error = '';

  $http.get(API + '/dashboard/stats')
    .then(function(res) { $scope.stats = res.data; })
    .catch(function() { $scope.error = 'Failed to load dashboard stats.'; })
    .finally(function() { $scope.loading = false; });

  $scope.goTo = function(path) { $location.path(path); };
}]);

// Member Dashboard Controller
app.controller('MemberDashCtrl', ['$scope', '$http', 'AuthService',
function($scope, $http, AuthService) {
  $scope.borrows = [];
  $scope.fines = [];
  $scope.reservations = [];
  $scope.loading = true;
  $scope.error = '';
  var user = AuthService.getUser();

  // Load borrows
  $http.get(API + '/borrow?member_id=' + user.id)
    .then(function(res) { $scope.borrows = res.data; })
    .catch(function() {});

  // Load fines
  $http.get(API + '/fines?member_id=' + user.id)
    .then(function(res) { $scope.fines = res.data; })
    .catch(function() {});

  // Load reservations
  $http.get(API + '/reservations?member_id=' + user.id)
    .then(function(res) { $scope.reservations = res.data; })
    .catch(function() {})
    .finally(function() { $scope.loading = false; });

  // Due date helper
  $scope.daysUntilDue = function(dueDate) {
    var due = new Date(dueDate);
    var today = new Date();
    var diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  $scope.totalUnpaidFines = function() {
    return $scope.fines.filter(function(f) { return !f.paid; })
      .reduce(function(sum, f) { return sum + parseFloat(f.amount); }, 0);
  };

  $scope.currentBorrows = function() {
    return $scope.borrows.filter(function(b) { return b.status === 'borrowed' || b.status === 'overdue'; });
  };
}]);
