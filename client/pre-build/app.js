var app = angular.module('GameOfLife', ['ui.router', 'fsaPreBuilt', 'btford.socket-io', 'ngRoute', 'ui.bootstrap']);

app.config(function($urlRouterProvider, $locationProvider, $routeProvider, $stateProvider) {
    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    $locationProvider.html5Mode(true);
    // $routeProvider.when('/builder/',{templateUrl:'/builder/builder.html'});
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    $urlRouterProvider.otherwise('/');
    $stateProvider.state("Modal", {
        views: {
            "modal": {
                templateUrl: "/pre-build/modal.html"
            }
        },
        abstract: true
    });
    $stateProvider.state("Modal.login", {
        views: {
            "modal": {
                templateUrl: "/pre-build/modals/confirm.html"
            }
        }
    });
});

// This app.run is for controlling access to specific states.
app.run(function($rootScope, AuthService, $state, UserFactory) {
    AuthService.getLoggedInUser().then(function(user) {
        UserFactory.currentUser = user;
    });
    // The given state requires an authenticated user.
    var destinationStateRequiresAuth = function(state) {
        return state.data && state.data.authenticate;
    };

    // $stateChangeStart is an event fired
    // whenever the process of changing a state begins.
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams) {

        if (!destinationStateRequiresAuth(toState)) {
            // The destination state does not require authentication
            // Short circuit with return.
            return;
        }

        if (AuthService.isAuthenticated()) {
            // The user is authenticated.
            // Short circuit with return.
            return;
        }

        // Cancel navigating to new state.
        event.preventDefault();

        AuthService.getLoggedInUser().then(function(user) {
            // If a user is retrieved, then renavigate to the destination
            // (the second time, AuthService.isAuthenticated() will work)
            // otherwise, if no user is logged in, go to "login" state.
            if (user) {
                $state.go(toState.name, toParams);
            } else {
                $state.go('login');
            }
        });

    });

});