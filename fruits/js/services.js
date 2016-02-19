'use strict';

/* Services */

var fruitsServices = angular.module('fruitsServices', ['ngResource']);

fruitsServices.factory('Serie', ['$resource',
  function($resource){
    return $resource('http://fruits/api/series/:id');
  }]);
fruitsServices.factory('Film', ['$resource',
  function($resource){
    return $resource('http://fruits/api/films/:id');
  }]);
fruitsServices.factory('Saison', ['$resource',
  function($resource){
    return $resource('http://fruits/api/series/saison/:id');
  }]);
fruitsServices.factory('Serveur', ['$resource',
  function($resource){
    return $resource('http://fruits/api/serveurs/:id');
  }]);
fruitsServices.factory('Dossier', ['$resource',
  function($resource){
    return $resource('http://fruits/api/files/:id', {},
    {click: {url:'http://fruits/api/files/:id/click'},
     error: {url:'http://fruits/api/files/:id/error'},
     getsubtitles: {url:'http://129.104.201.13/api/files/:id/subtitles/:lang'},
     new: {url:'http://fruits/api/new'}});
  }]);
fruitsServices.factory('Search', ['$resource',
  function($resource){
    return $resource('http://fruits/api/search/:q');
  }]);
fruitsServices.factory('Artist', ['$resource',
  function($resource){
    return $resource('http://fruits/api/music/artists/:aid');
  }]);
fruitsServices.factory('Suggest', ['$resource',
  function($resource){
    return $resource('http://fruits/api/suggest/search/:q', {},
      {ask: {url:'http://fruits/api/suggest/:type/:tmdbid'}});
  }]);

fruitsApp.service('browser', ['$window', function($window) {
     return function() {
        var userAgent = $window.navigator.userAgent;
        var browsers = {chrome: /chrome/i, safari: /safari/i, firefox: /firefox/i, ie: /internet explorer/i};
        for(var key in browsers) {
            if (browsers[key].test(userAgent)) {
                return key;
            }
       };
       return 'unknown';
    }
}]);

fruitsApp.factory('navigation', ['$window', function($window) {
    var o = {
        film: null,
        serie: {
            id: null,
            saison: {
                id: null,
                numero: null
            },
            episode: null
        }
    };
    return o;
}]);

fruitsApp.factory('downloader', ['$window', function($window) {
    var CHUNK_LENGTH = 50;
    ipcRenderer.on('download-progress', function(e, progress) {
        o.activeDownload.progress = progress;
        o.lastChunks[o.lastChunk] = {progress: progress, date: new Date().getTime()};
        o.lastChunk = (o.lastChunk + 1) % CHUNK_LENGTH; // we store last 100 progress
    });
    ipcRenderer.on('download-infos', function(e, infos) {
        o.activeDownload.totalSize = infos.size;
    });
    ipcRenderer.on('download-end', function(e, b) {
        o.activeDownload.finished = true;
        o.activeDownload.active = false;
        o.lastChunks = [];
        o.lastChunk = 0;
        var oldIndex = o.files.indexOf(o.activeDownload);
        if (oldIndex < o.files.length-1) {
            o.activeDownload = o.files[oldIndex+1];
            o.activeDownload.active = true;
            ipcRenderer.send('download-file', o.activeDownload);
        } else {
            o.activeDownload = null;
        }
    });
    var o = {
        savingPath: remote.app.getPath('videos') + '/',
        files: [],
        lastChunks: [],
        lastChunk: 0,
        addDownload: function (host, path, destinationPath, destinationName, displayedName, totalSize) {
            var file = {
                host: host,
                path: path,
                destinationName: destinationName,
                relativePath: destinationPath,
                destinationPath: o.savingPath + destinationPath,
                displayedName: displayedName,
                date: new Date(),
                active: false,
                pause: false,
                finished: false,
                progress: 0,
                totalSize: parseFloat(totalSize) // Will be confirmed by an event from main.js when download begin
            };
            o.files.push(file);
            if (!o.activeDownload) {
                file.active = true;
                o.activeDownload = file;
                ipcRenderer.send('download-file', file);
            }
        },
        getCurrentSpeedInfos: function() {
            if (o.lastChunks.length < CHUNK_LENGTH) {
                return false;
            }
            var previousChunk = (o.lastChunk + (CHUNK_LENGTH-1)) % CHUNK_LENGTH;
            return {
                time: o.lastChunks[o.lastChunk].date - o.lastChunks[previousChunk].date,
                size: o.lastChunks[o.lastChunk].progress - o.lastChunks[previousChunk].progress
            };
        },
        getCurrentSpeed: function() {
            var infos = o.getCurrentSpeedInfos();
            if (!infos) {
                return 0;
            }
            return infos.size / infos.time * 1000;
        },
        getETA: function() {
            var infos = o.getCurrentSpeedInfos();
            if (!infos) {
                return 0;
            }
            var sizeToDl = o.activeDownload.totalSize - o.activeDownload.progress;
            return Math.floor(infos.time * sizeToDl / infos.size / 1000);
        },
        pause: function() {
            ipcRenderer.send('download-pause');
            o.activeDownload.pause = true;
        },
        resume: function() {
            ipcRenderer.send('download-resume');
            o.activeDownload.pause = false;
        },
        abort: function(file) {
            if (o.activeDownload == file) {
                ipcRenderer.send('download-abort');
            } else {
                o.files.splice(o.files.indexOf(file), 1);
            }
        },
        activeDownload: null,
        numberWaiting: function() {
            return _.filter(o.files, {finished: false}).length;
        },
        sizeRemaining: function() {
            return _.reduce(o.files, function(size, f) {
                return size + f.totalSize - f.progress;
            }, 0);
        },
        getTotalETA: function() {
            var infos = o.getCurrentSpeedInfos();
            if (!infos) {
                return false;
            }
            var sizeToDl = o.sizeRemaining();
            return moment.duration(Math.floor(infos.time * sizeToDl / infos.size)).humanize(true);
        }
    };
    storage.get('download-path', function(error, data) {
        if (!error && data.path) {
            o.savingPath = data.path;
        }
    });
    return o;
}]);

fruitsApp.factory('wcplayer', ['$timeout', '$q', '$rootScope', 'Dossier', function($timeout, $q, $rootScope, Dossier) {
    var o = {
        displayed: false,
        player: null,
        show: function() {
            if (o.displayed) {
                var defer = $q.defer();
                defer.resolve(true);
                return defer.promise;
            }
            this.displayed = true;
            return $timeout(function() {
                o.player = new wjs("#playerFilm").addPlayer({ autoplay: true, vlcArgs: ["--ftp-user=anonymous", "--ftp-pwd=fruits@fruits.fr"]}).onError(function (e) {
                    console.log(e);
                }).onMediaChanged(function() {
                    $rootScope.$apply();
                });
                window.videoPlayer = o.player;
            }, 300);
        },
        play: function(title, url, file) {
            if (file.subtitles.length == 0) {
                file.subtitles = {};
            }
            var fid = file.id || file.fichier;
            var downloads = [];
            angular.forEach(['fre', 'eng'], function (lang) {
                if (!file.subtitles[lang]) {
                    var dl = Dossier.getsubtitles({id: fid, lang: lang}).$promise.then(function (subs) {
                        file.subtitles[lang] = subs.id;
                        var defer = $q.defer();
                        defer.resolve(true);
                        return defer.promise;
                    }, function() {
                        var defer = $q.defer();
                        defer.resolve(true);
                        return defer.promise;
                    });
                    downloads.push(dl);
                }
            });
            return $q.all(downloads).then(function () {
                var names = {fre: "Français", eng: "English"};
                var subtitles = {};
                angular.forEach(file.subtitles, function (id, l) {
                    subtitles[names[l]] = "http://129.104.201.13/api/files/" + fid+ "/subtitles/" + id + "/show.srt";
                });
                return o.show().then(function() {
                    o.player.addPlaylist({
                        url: url,
                        subtitles: subtitles,
                        title: title
                    });
                    o.fullscreen(true);
                });
            });
        },
        fullscreen: function(yesOrNo) {
            remote.getCurrentWebContents().executeJavaScript('window.videoPlayer.fullscreen(' + yesOrNo + ')', true);
        },
        toggleFullscreen: function() {
            remote.getCurrentWebContents().executeJavaScript('window.videoPlayer.toggleFullscreen()', true);
        },
        fileReceived: function(file) {
            if (o.displayed) {
                var success = o.player.vlc.subtitles.load(file.path);
                $timeout(function() {
                    if (success) {
                        o.player.subTrack(o.player.subCount()-1);
                        o.player.notify(o.player.subDesc(o.player.subTrack()).language);
                    }
                }, 300);
            }
        },
        getCurrentFile: function() {
            return o.player.itemDesc(o.player.currentItem());
        },
        getCurrentTitle: function() {
            return o.getCurrentFile().title;
        },
        close: function() {
            o.player.stop();
            return $timeout(function() {
                o.displayed = false;
            }, 200);
        }
    };
    return o;
}]);
