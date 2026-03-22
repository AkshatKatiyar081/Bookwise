// ============================================
// Bookwise Library — AngularJS Application
// ============================================

var app = angular.module('LibraryApp', ['ngRoute']);

// --- API Base URL ---
var API = '/api';

// --- Auth Service ---
app.factory('AuthService', ['$window', function($window) {
  var service = {};

  service.setToken = function(token) {
    $window.localStorage.setItem('bw_token', token);
  };

  service.getToken = function() {
    return $window.localStorage.getItem('bw_token');
  };

  service.setUser = function(user) {
    $window.localStorage.setItem('bw_user', JSON.stringify(user));
  };

  service.getUser = function() {
    var u = $window.localStorage.getItem('bw_user');
    return u ? JSON.parse(u) : null;
  };

  service.isLoggedIn = function() {
    return !!service.getToken();
  };

  service.isAdmin = function() {
    var user = service.getUser();
    return user && (user.role === 'admin' || user.role === 'librarian');
  };

  service.logout = function() {
    $window.localStorage.removeItem('bw_token');
    $window.localStorage.removeItem('bw_user');
  };

  return service;
}]);

// --- HTTP Interceptor (add JWT token to all requests) ---
app.factory('AuthInterceptor', ['AuthService', function(AuthService) {
  return {
    request: function(config) {
      var token = AuthService.getToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = 'Bearer ' + token;
      }
      return config;
    },
    responseError: function(response) {
      if (response.status === 401 || response.status === 403) {
        AuthService.logout();
        window.location.href = '#!/login';
      }
      return Promise.reject(response);
    }
  };
}]);

app.config(['$httpProvider', function($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
}]);

// --- Route Resolve Helpers ---
var requireAuth = ['AuthService', '$location', function(AuthService, $location) {
  if (!AuthService.isLoggedIn()) {
    $location.path('/login');
    return false;
  }
  return true;
}];

var requireAdmin = ['AuthService', '$location', function(AuthService, $location) {
  if (!AuthService.isLoggedIn()) {
    $location.path('/login');
    return false;
  }
  if (!AuthService.isAdmin()) {
    $location.path('/my-dashboard');
    return false;
  }
  return true;
}];

// --- Routes ---
app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
  $routeProvider
    .when('/login', {
      templateUrl: 'views/login.html',
      controller: 'AuthCtrl'
    })
    .when('/register', {
      templateUrl: 'views/register.html',
      controller: 'AuthCtrl'
    })
    .when('/dashboard', {
      templateUrl: 'views/dashboard-admin.html',
      controller: 'DashboardCtrl',
      resolve: { auth: requireAdmin }
    })
    .when('/my-dashboard', {
      templateUrl: 'views/dashboard-member.html',
      controller: 'MemberDashCtrl',
      resolve: { auth: requireAuth }
    })
    .when('/books', {
      templateUrl: 'views/books-list.html',
      controller: 'BooksCtrl'
    })
    .when('/books/add', {
      templateUrl: 'views/add-book.html',
      controller: 'BooksCtrl',
      resolve: { auth: requireAdmin }
    })
    .when('/books/:id', {
      templateUrl: 'views/book-detail.html',
      controller: 'BookDetailCtrl'
    })
    .when('/books/:id/edit', {
      templateUrl: 'views/add-book.html',
      controller: 'BooksCtrl',
      resolve: { auth: requireAdmin }
    })
    .when('/members', {
      templateUrl: 'views/members-list.html',
      controller: 'MembersCtrl',
      resolve: { auth: requireAdmin }
    })
    .when('/members/:id', {
      templateUrl: 'views/member-detail.html',
      controller: 'MemberDetailCtrl',
      resolve: { auth: requireAuth }
    })
    .when('/borrow', {
      templateUrl: 'views/borrow-records.html',
      controller: 'BorrowCtrl',
      resolve: { auth: requireAuth }
    })
    .when('/borrow/issue', {
      templateUrl: 'views/return-book.html',
      controller: 'BorrowCtrl',
      resolve: { auth: requireAdmin }
    })
    .when('/reservations', {
      templateUrl: 'views/reservations.html',
      controller: 'ReservationsCtrl',
      resolve: { auth: requireAdmin }
    })
    .when('/my-reservations', {
      templateUrl: 'views/reservations.html',
      controller: 'ReservationsCtrl',
      resolve: { auth: requireAuth }
    })
    .when('/fines', {
      templateUrl: 'views/fines.html',
      controller: 'FinesCtrl',
      resolve: { auth: requireAdmin }
    })
    .when('/my-fines', {
      templateUrl: 'views/fines.html',
      controller: 'FinesCtrl',
      resolve: { auth: requireAuth }
    })
    .otherwise({ redirectTo: '/login' });
}]);

// --- Nav Controller ---
app.controller('NavCtrl', ['$scope', '$location', 'AuthService', function($scope, $location, AuthService) {
  $scope.isLoggedIn = function() { return AuthService.isLoggedIn(); };
  $scope.isAdmin = function() { return AuthService.isAdmin(); };
  $scope.currentUser = function() { return AuthService.getUser() || {}; };
  $scope.isActive = function(path) { return $location.path() === path; };
  $scope.logout = function() {
    AuthService.logout();
    $location.path('/login');
  };
}]);
