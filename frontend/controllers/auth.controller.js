// ============================================
// Auth Controller — Login & Register
// ============================================

app.controller('AuthCtrl', ['$scope', '$http', '$location', 'AuthService',
function($scope, $http, $location, AuthService) {
  // Redirect if already logged in
  if (AuthService.isLoggedIn()) {
    $location.path(AuthService.isAdmin() ? '/dashboard' : '/my-dashboard');
    return;
  }

  $scope.loginData = {};
  $scope.registerData = {};
  $scope.error = '';
  $scope.loading = false;

  // Login
  $scope.login = function() {
    $scope.error = '';
    if (!$scope.loginData.email || !$scope.loginData.password) {
      $scope.error = 'Please enter both email and password.';
      return;
    }
    $scope.loading = true;
    $http.post(API + '/auth/login', $scope.loginData)
      .then(function(res) {
        AuthService.setToken(res.data.token);
        AuthService.setUser(res.data.user);
        if (res.data.user.role === 'admin' || res.data.user.role === 'librarian') {
          $location.path('/dashboard');
        } else {
          $location.path('/my-dashboard');
        }
      })
      .catch(function(err) {
        $scope.error = err.data ? err.data.error : 'Login failed. Please try again.';
      })
      .finally(function() { $scope.loading = false; });
  };

  // Register
  $scope.register = function() {
    $scope.error = '';
    var d = $scope.registerData;
    if (!d.name || !d.email || !d.password) {
      $scope.error = 'Name, email, and password are required.';
      return;
    }
    if (d.password.length < 6) {
      $scope.error = 'Password must be at least 6 characters.';
      return;
    }
    if (d.password !== d.confirmPassword) {
      $scope.error = 'Passwords do not match.';
      return;
    }
    $scope.loading = true;
    $http.post(API + '/auth/register', d)
      .then(function(res) {
        AuthService.setToken(res.data.token);
        AuthService.setUser(res.data.user);
        $location.path('/my-dashboard');
      })
      .catch(function(err) {
        $scope.error = err.data ? err.data.error : 'Registration failed.';
      })
      .finally(function() { $scope.loading = false; });
  };
}]);
