'use strict';

/* App Module */

var fruitsApp = angular.module('fruitsApp', [
  'ngRoute',
  'ngSanitize',
  'angularMoment',
  'infinite-scroll',
  //'fruitsAnimations',

  'fruitsControllers',
  'fruitsFilters',
  'fruitsServices'
]);

fruitsApp.run(function(amMoment) {
    amMoment.changeLanguage('fr');
});

fruitsApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        redirectTo: '/films'
      }).
      when('/series', {
        templateUrl: 'partials/serie-list.html',
        controller: 'SeriesListCtrl'
      }).
      when('/series/:id', {
        templateUrl: 'partials/serie.html',
        controller: 'SerieCtrl'
      }).
      when('/films', {
        templateUrl: 'partials/film-list.html',
        controller: 'FilmsListCtrl'
      }).
      when('/films/:id', {
        templateUrl: 'partials/film.html',
        controller: 'FilmCtrl'
      }).
      when('/music/artists', {
        templateUrl: 'partials/artists-list.html',
        controller: 'ArtistsListCtrl'
      }).
      when('/music/artists/:aid', {
        templateUrl: 'partials/artist.html',
        controller: 'ArtistCtrl'
      }).
      when('/serveurs', {
        templateUrl: 'partials/serveurs.html',
        controller: 'ServeursCtrl'
      }).
      when('/downloads', {
        templateUrl: 'partials/downloads.html',
        controller: 'DownloadsCtrl'
      }).
      when('/new', {
        templateUrl: 'partials/fichiers.html',
        controller: 'NewCtrl'
      }).
      when('/suggest', {
        templateUrl: 'partials/suggest.html',
        controller: 'SuggestCtrl'
      }).
      when('/dossier/:id', {
        templateUrl: 'partials/fichiers.html',
        controller: 'DossierCtrl'
      }).
      when('/search/:q*', {
        templateUrl: 'partials/search.html',
        controller: 'SearchCtrl'
      }).
      otherwise({
        redirectTo: '/films'
      });
  }]);

fruitsApp.run(function($rootScope, $location, Dossier, browser, wcplayer, downloader, navigation) {
    $rootScope.search = function() {
        $location.path('/search/' + $rootScope.rechercher);
    };
    $rootScope.clickf = function(file) {
        var cf = Dossier.click({id: file});
    };
    $rootScope.errorf = function(file) {
        var cf = Dossier.error({id: file});
    };
    $rootScope.rsens = function() {
        if ($rootScope.rtri != 'title') {
            return true;
        }
        return false;
    };
    $rootScope.seuil = function() {
	    return Math.random() > 0.3;
    };
    $rootScope.navigation = navigation;
    $rootScope.downloader = downloader;

    $rootScope.wcplayer = wcplayer;

    var holder = document.body;
    holder.ondragover = function () {
        return false;
    };
    holder.ondragleave = holder.ondragend = function () {
        return false;
    };
    holder.ondrop = function (e) {
        e.preventDefault();
        var file = e.dataTransfer.files[0];
        console.log('File you dragged here is', file.path);
        wcplayer.fileReceived(file);
        return false;
    };
});

function fzero(n) {
  if (n < 10) {
    return "0" + n;
  } else {
    return n;
  }
}
var imgFtpState = {};
function srandom()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 30; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
