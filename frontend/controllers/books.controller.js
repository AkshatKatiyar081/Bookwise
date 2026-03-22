// ============================================
// Books Controller — List, Add, Edit, Detail
// ============================================

app.controller('BooksCtrl', ['$scope', '$http', '$location', '$routeParams', 'AuthService',
function($scope, $http, $location, $routeParams, AuthService) {
  $scope.books = [];
  $scope.searchQuery = '';
  $scope.loading = true;
  $scope.error = '';
  $scope.success = '';
  $scope.isAdmin = AuthService.isAdmin();
  $scope.isEditing = !!$routeParams.id;
  $scope.bookForm = {};
  $scope.showDeleteModal = false;
  $scope.bookToDelete = null;

  // Load books
  $scope.loadBooks = function() {
    $scope.loading = true;
    var url = API + '/books';
    if ($scope.searchQuery) url += '?q=' + encodeURIComponent($scope.searchQuery);
    $http.get(url)
      .then(function(res) { $scope.books = res.data; })
      .catch(function(err) { $scope.error = 'Failed to load books.'; })
      .finally(function() { $scope.loading = false; });
  };

  // Search
  $scope.search = function() { $scope.loadBooks(); };
  $scope.clearSearch = function() { $scope.searchQuery = ''; $scope.loadBooks(); };

  // If on add/edit page, load book data for editing
  if ($routeParams.id && $location.path().indexOf('/edit') > -1) {
    $http.get(API + '/books/' + $routeParams.id)
      .then(function(res) {
        $scope.bookForm = res.data;
        $scope.loading = false;
      })
      .catch(function() {
        $scope.error = 'Book not found.';
        $scope.loading = false;
      });
  } else if ($location.path() === '/books/add') {
    $scope.loading = false;
    $scope.bookForm = { total_copies: 1, available_copies: 1 };
  } else {
    $scope.loadBooks();
  }

  // Save book (create or update)
  $scope.saveBook = function() {
    $scope.error = '';
    $scope.success = '';
    var b = $scope.bookForm;
    if (!b.title || !b.author || !b.isbn) {
      $scope.error = 'Title, author, and ISBN are required.';
      return;
    }


    if ($scope.isEditing) {
      $http.put(API + '/books/' + $routeParams.id, b)
        .then(function() {
          $scope.success = 'Book updated successfully!';
          setTimeout(function() { $scope.$apply(function() { $location.path('/books'); }); }, 1000);
        })
        .catch(function(err) { $scope.error = err.data ? err.data.error : 'Failed to update.'; });
    } else {
      $http.post(API + '/books', b)
        .then(function() {
          $scope.success = 'Book added successfully!';
          setTimeout(function() { $scope.$apply(function() { $location.path('/books'); }); }, 1000);
        })
        .catch(function(err) { $scope.error = err.data ? err.data.error : 'Failed to add book.'; });
    }
  };

  // Delete book
  $scope.confirmDelete = function(book) {
    $scope.bookToDelete = book;
    $scope.showDeleteModal = true;
  };
  $scope.cancelDelete = function() {
    $scope.showDeleteModal = false;
    $scope.bookToDelete = null;
  };
  $scope.deleteBook = function() {
    if (!$scope.bookToDelete) return;
    $http.delete(API + '/books/' + $scope.bookToDelete.book_id)
      .then(function() {
        $scope.showDeleteModal = false;
        $scope.bookToDelete = null;
        $scope.loadBooks();
      })
      .catch(function(err) {
        $scope.error = err.data ? err.data.error : 'Failed to delete.';
        $scope.showDeleteModal = false;
      });
  };
}]);

// Book Detail Controller
app.controller('BookDetailCtrl', ['$scope', '$http', '$routeParams', 'AuthService',
function($scope, $http, $routeParams, AuthService) {
  $scope.book = null;
  $scope.loading = true;
  $scope.error = '';
  $scope.isAdmin = AuthService.isAdmin();
  $scope.isLoggedIn = AuthService.isLoggedIn();
  $scope.reserveSuccess = '';

  $http.get(API + '/books/' + $routeParams.id)
    .then(function(res) { $scope.book = res.data; })
    .catch(function() { $scope.error = 'Book not found.'; })
    .finally(function() { $scope.loading = false; });

  // Reserve book
  $scope.reserveBook = function() {
    var user = AuthService.getUser();
    if (!user) return;
    $http.post(API + '/reservations', { book_id: $routeParams.id, member_id: user.id })
      .then(function(res) {
        $scope.reserveSuccess = 'Reserved! Queue position: #' + res.data.queue_position;
      })
      .catch(function(err) {
        $scope.error = err.data ? err.data.error : 'Failed to reserve.';
      });
  };
}]);
