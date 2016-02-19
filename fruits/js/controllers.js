'use strict';

/* Controllers */

var fruitsControllers = angular.module('fruitsControllers', []);

fruitsControllers.controller('SeriesListCtrl', ['$scope', '$rootScope', 'Serie', 'Saison', 'navigation',
function($scope, $rootScope, Serie, Saison, navigation) {
    $rootScope.page = 'series';
    $rootScope.rechercher = '';
    document.getElementById('rechercher').focus();
    $scope.focus = false;
    $scope.fep = false;
    $scope.series = Serie.query();
    navigation.serie.id = null;
    navigation.serie.saison = {
        id: null,
        numero: null
    };
    navigation.serie.episode = null;

    $scope.min = function(a, b) {
        if (a < b) {
            return a;
        } else {
            return b;
        }
    };
}]);
fruitsControllers.controller('SerieCtrl', ['$scope', '$rootScope', 'Serie', 'Saison', '$routeParams', 'wcplayer', 'downloader', 'navigation',
function($scope, $rootScope, Serie, Saison, $routeParams, wcplayer, downloader, navigation) {
    $rootScope.page = 'series';
    $rootScope.rechercher = '';
    $scope.serie = Serie.get({id: $routeParams.id});
    $scope.serie.$promise.then(function() {
        if (navigation.serie.saison.id) {
            return $scope.affep(navigation.serie.saison.id, navigation.serie.saison.numero, true);
        }
    }).then(function() {
        if (navigation.serie.episode) {
            var episode = _.find($scope.episodes, {episode: navigation.serie.episode});
            if (episode) {
                $scope.affepf(episode.episode, episode.ep, episode.sub);
            }
        }
    });
    $scope.nsaison = -1;
    navigation.serie.id = $routeParams.id;

    $scope.playFile = function(url, file) {
        var nextAdded = false;
        wcplayer.play($scope.serie.nom + ' - S' + fzero($scope.nsaison) + ' - E' + fzero($scope.epn), url, file).then(function() {
            wcplayer.player.onPosition(function (p) {
                if (wcplayer.getCurrentFile().mrl == url && p >= 0.94 && !nextAdded) {
                    nextAdded = true;
                    // We need to find the next file
                    // Let's take the largest in the next episode
                    var episode = _.find($scope.episodes, {episode: "" + (parseInt($scope.epn) + 1)});
                    if (episode) {
                        $scope.affepf(episode.episode, episode.ep, episode.sub);
                        var files = _.sortBy(episode.ep, ['taille']);
                        if (files.length > 0) {
                            var largestFile = files[files.length-1];
                            $scope.playFile('ftp://' + largestFile.serveur + largestFile.chemin_complet, largestFile);
                        }
                    }
                }
            });
        });
    };
    $scope.addDownload = function(episode, file) {
        var sanum = fzero($scope.nsaison);
        var epnum = fzero(episode);
        downloader.addDownload(file.serveur, file.chemin_complet, $scope.serie.nom + '/S' + sanum + '/', file.nom, $scope.serie.nom + ' - S' + sanum + ' - E' + epnum, file.taille);
    };

    $scope.affep = function(saison, numero, preserveep) {
        if (!preserveep) {
            navigation.serie.episode = null;
        }
        if ($scope.nsaison == numero) {
            $scope.fep = false;
            $scope.nsaison = -1;
            navigation.serie.saison = {
                id: null,
                numero: null
            };
        } else {
            navigation.serie.saison = {
                id: saison,
                numero: numero
            };
            $scope.fep = true;
            $scope.fepf = false;
            $scope.nsaison = numero;
            $scope.epn = -1;
            delete $scope.choixQualite;
            delete $scope.choixLangues;
            $scope.qualiteChoisie = "none";
            $scope.langueChoisie = "none";
            $scope.dlLance = false;
            $scope.episodes = Saison.query({id: saison});
            return $scope.episodes.$promise;
        }
    };
    $scope.affepf = function(episode, ep, sub) {
        $scope.epf = ep;
        $scope.eps = sub;
        if (episode == $scope.epn) {
            $scope.fepf = false;
            $scope.epn = -1;
            navigation.serie.episode = null;
        } else {
            navigation.serie.episode = episode;
            $scope.epn = episode;
            $scope.fepf = true;
        }
    };

    // Retourne des infos concernant les choix possibles
    $scope.preDlSaison = function(episodes) {
        var nbEp = episodes.length;

        // On trouve les plus gros et plus petits fichiers
        var choixQualite = {
            most: {
                taille: 0,
                nb_clics: 0,
                nom: "Défaut",
                ep: [],
                sub: {}
            },
            min: {
                taille: 0,
                nb_clics: 0,
                nom: "Basse",
                ep: [],
                sub: {}
            },
            moyen: {
                taille: 0,
                nb_clics: 0,
                nom: "Moyenne",
                ep: [],
                sub: {}
            },
            max: {
                taille: 0,
                nb_clics: 0,
                nom: "HD",
                ep: [],
                sub: {}
            }
        }
        for (var i = 0; i < nbEp; i++) {
            episodes[i].min = {
                taille: 999999999999,
                nb_clics: 0,
                id: -1
            };
            episodes[i].max = {
                taille: 0,
                nb_clics: 0,
                id: -1
            };
            episodes[i].most = {
                taille: 0,
                nb_clics: 0,
                id: -1
            };
            for (var j = 0; j < episodes[i].ep.length; j++) {
                if (episodes[i].ep[j].taille > 10000 && (episodes[i].ep[j].taille < (0.9*episodes[i].min.taille)
                || (episodes[i].ep[j].taille < (1.1*episodes[i].min.taille) && episodes[i].ep[j].nb_clics > episodes[i].min.nb_clics))) {
                    episodes[i].min = {
                        taille: episodes[i].ep[j].taille,
                        nb_clics: episodes[i].ep[j].nb_clics,
                        id: j
                    };
                }
                if (episodes[i].ep[j].taille > (1.1*episodes[i].max.taille)
                || (episodes[i].ep[j].taille > (0.9*episodes[i].max.taille) && episodes[i].ep[j].nb_clics > episodes[i].max.nb_clics)) {
                    episodes[i].max = {
                        taille: episodes[i].ep[j].taille,
                        nb_clics: episodes[i].ep[j].nb_clics,
                        id: j
                    };
                }
                if (episodes[i].ep[j].nb_clics > episodes[i].most.nb_clics) {
                    episodes[i].most = {
                        taille: episodes[i].ep[j].taille,
                        nb_clics: episodes[i].ep[j].nb_clics,
                        id: j
                    };
                }
            }
            choixQualite.min.ep.push(episodes[i].ep[episodes[i].min.id]);
            choixQualite.max.ep.push(episodes[i].ep[episodes[i].max.id]);
            choixQualite.most.ep.push(episodes[i].ep[episodes[i].most.id]);
            choixQualite.min.taille += episodes[i].min.taille;
            choixQualite.min.nb_clics += episodes[i].min.nb_clics;
            choixQualite.max.taille += episodes[i].max.taille;
            choixQualite.max.nb_clics += episodes[i].max.nb_clics
            choixQualite.most.taille += episodes[i].most.taille;
            choixQualite.most.nb_clics += episodes[i].most.nb_clics
        }

        // On cherche des fichiers moyens
        for (var i = 0; i < nbEp; i++) {
            episodes[i].moyen = {
                taille: 0,
                nb_clics: -1,
                id: -1
            };
            for (var j = 0; j < episodes[i].ep.length; j++) {
                if (episodes[i].ep[j].taille > 10000
                    && episodes[i].ep[j].taille > (1.5*episodes[i].min.taille)
                    && episodes[i].ep[j].taille < (0.8*episodes[i].max.taille)
                    && episodes[i].ep[j].nb_clics > episodes[i].moyen.nb_clics) {
                        episodes[i].moyen = {
                            taille: episodes[i].ep[j].taille,
                            nb_clics: episodes[i].ep[j].nb_clics,
                            id: j
                        };
                    }
                }
                if (episodes[i].moyen.id == -1) {
                    episodes[i].moyen.taille = episodes[i].most.taille;
                    episodes[i].moyen.nb_clics = episodes[i].most.nb_clics;
                    episodes[i].moyen.id = episodes[i].most.id;
                }
                choixQualite.moyen.ep.push(episodes[i].ep[episodes[i].moyen.id]);
                choixQualite.moyen.taille += episodes[i].moyen.taille;
                choixQualite.moyen.nb_clics += episodes[i].moyen.nb_clics
            }

            // On regarde s'il y a des qualités à virer
            if ((choixQualite.most.taille > 0.9*choixQualite.min.taille && choixQualite.most.taille < 1.2*choixQualite.min.taille)
            || (choixQualite.most.taille > 0.9*choixQualite.max.taille && choixQualite.most.taille < 1.1*choixQualite.max.taille)
            || (choixQualite.most.taille > 0.9*choixQualite.moyen.taille && choixQualite.most.taille < 1.1*choixQualite.moyen.taille)) {
                delete choixQualite.most;
            }
            if ((choixQualite.moyen.taille < 1.2*choixQualite.min.taille)
            || (choixQualite.moyen.taille > 0.9*choixQualite.max.taille && choixQualite.moyen.taille < 1.1*choixQualite.max.taille)) {
                delete choixQualite.moyen;
            }
            if (choixQualite.max.taille < 1.2*choixQualite.min.taille) {
                delete choixQualite.max;
            }

            // Maintenant on s'occupe des sous-titres
            // 1 : on regarde les langues disponibles
            //     on ne gère que fr et en pour le moment
            var languesDispo = [];
            for (var i = 0; i < nbEp && languesDispo.length <= 2; i++) {
                for (var j = 0; j < episodes[i].sub.length && languesDispo.length <= 2; j++) {
                    if (languesDispo.indexOf("fr") == -1 && /\.fr\./.test(episodes[i].sub[j].nom)) {
                        languesDispo.push("fr");
                    }
                    if (languesDispo.indexOf("en") == -1 && /\.en\./.test(episodes[i].sub[j].nom)) {
                        languesDispo.push("en");
                    }
                }
            }
            for (var l = 0; l < languesDispo.length; l++) {
                var langue = languesDispo[l];
                var regexSub = new RegExp("\." + langue + "\.[a-z0-9]+$","gi");
                var regexLangue = new RegExp("\." + langue + "\.");
                for (var key in choixQualite) {
                    if (!choixQualite.hasOwnProperty(key)) {
                        continue;
                    }
                    choixQualite[key].sub[langue] = [];
                    var nbEpQualite = choixQualite[key].ep.length;
                    for (var i = 0; i < nbEpQualite; i++) {
                        var max = {
                            id: -1,
                            nb_clics: -1
                        };
                        for (var j = 0; j < episodes[i].sub.length; j++) {
                            if (choixQualite[key].ep[i].nom.replace(/\.[a-z0-9]+$/gi, "") == episodes[i].sub[j].nom.replace(regexSub, "")) {
                                choixQualite[key].sub[langue].push(episodes[i].sub[j]);
                                max.id = -1;
                                break;
                            }
                            if (regexLangue.test(episodes[i].sub[j].nom) && episodes[i].sub[j].nb_clics > max.nb_clics) {
                                max.id = j;
                                max.nb_clics = episodes[i].sub[j].nb_clics;
                            }
                        }
                        if (max.id >= 0) {
                            choixQualite[key].sub[langue].push(episodes[i].sub[max.id]);
                        }
                    }
                }
            }
            console.log(choixQualite);
            console.log(languesDispo);
            $scope.choixQualite = choixQualite;
            $scope.choixLangues = languesDispo;
        };
        $scope.dlSaison = function() {
            $scope.dlLance = true;
            var files = [];
            if ($scope.langueChoisie != 'none') {
                files = $scope.choixQualite[$scope.qualiteChoisie].ep.concat($scope.choixQualite[$scope.qualiteChoisie].sub[$scope.langueChoisie]);
            } else {
                files = $scope.choixQualite[$scope.qualiteChoisie].ep;
            }
            angular.forEach(files, function (file) {
                downloader.addDownload(file.serveur, file.chemin_complet, $scope.serie.nom + '/S' + fzero($scope.nsaison) + '/', file.nom, file.nom, file.taille);
            });
        };
    }]);
fruitsControllers.controller('FilmsListCtrl', ['$scope', '$rootScope', 'Film', 'navigation',
function($scope, $rootScope, Film, navigation) {
    $rootScope.page = 'films';
    $rootScope.rechercher = '';
    document.getElementById('rechercher').focus();
    $scope.fep = false;
    $scope.films = Film.query();
    $scope.loadNb = 120;
    $scope.loadMore = function() {
        $scope.loadNb += 120;
    };
    navigation.film = null;
}]);
fruitsControllers.controller('FilmCtrl', ['$scope', '$rootScope', 'Film', '$routeParams', 'wcplayer', 'downloader', 'navigation',
function($scope, $rootScope, Film, $routeParams, wcplayer, downloader, navigation) {
    $rootScope.rechercher = '';
    $rootScope.page = 'films';
    $scope.film = Film.get({id: $routeParams.id});
    navigation.film = $routeParams.id;
    $scope.playFilm = function(url, file) {
        wcplayer.play($scope.film.titlefr, url, file);
    };
    $scope.addDownload = function(file) {
        downloader.addDownload(file.serveur, file.chemin_complet, '', file.nom, $scope.film.titlefr, file.taille);
    };
}]);
fruitsControllers.controller('ArtistsListCtrl', ['$scope', '$rootScope', 'Artist',
function($scope, $rootScope, Artist) {
    $rootScope.page = 'music';
    $rootScope.rechercher = '';
    document.getElementById('rechercher').focus();
    $scope.fep = false;
    $scope.artists = Artist.query();
    $scope.loadNb = 120;
    $scope.loadMore = function() {
        $scope.loadNb += 120;
    };
}]);
fruitsControllers.controller('ArtistCtrl', ['$scope', '$rootScope', '$sce', 'Artist', '$routeParams',
function($scope, $rootScope, $sce, Artist, $routeParams) {
    $rootScope.page = 'music';
    $rootScope.rechercher = '';
    $scope.artist = Artist.get({aid: $routeParams.aid});
    $scope.palid = -1;
    $scope.pmid = -1;
    var ltracks;
    $scope.afffiles = function(falid, fmid, ffiles) {
        if (falid == $scope.palid && fmid == $scope.pmid) {
            $scope.palid = -1;
            $scope.pmid = -1;
        } else {
            $scope.palid = falid;
            $scope.pmid = fmid;
        }
        ltracks = ffiles;
        ltracks.forEach(function(t) {
            t.seuil = $rootScope.seuil();
        });
        $scope.ftracks = ltracks;
    };
    $scope.lplay = function(ftrack) {
        if ($rootScope.player.mid == ftrack.mid) {
            if ($rootScope.player.play) {
                $rootScope.player.lecteur.pause();
                $rootScope.player.play = false;
            } else {
                $rootScope.player.lecteur.play();
                $rootScope.player.play = true;
            }
        } else {
            var ffile = ftrack.files[0];
            $rootScope.player.lecteur.src="ftp://" + ffile.serveur + ffile.chemin_complet;
            $rootScope.player.lecteur.play();
            $rootScope.player.play = true;
        }
        $rootScope.player.mid = ftrack.mid;
    };
}]);

fruitsControllers.controller('ServeursCtrl', ['$scope', '$rootScope', 'Serveur',
function($scope, $rootScope, Serveur) {
    $rootScope.page = 'serveurs';
    $rootScope.rechercher = '';

    $scope.serveurs = Serveur.query();
}]);
fruitsControllers.controller('DownloadsCtrl', ['$scope', '$rootScope', 'downloader',
function($scope, $rootScope, downloader) {
    $rootScope.page = 'downloads';
    $rootScope.rechercher = '';

    $scope.downloader = downloader;

    ipcRenderer.on('download-progress', function (e, progress) {
        $scope.$apply();
    });
    $scope.changeSavingPath = function() {
        remote.dialog.showOpenDialog({
            title: "Où enregistrer les fichiers",
            defaultPath: remote.app.getPath('videos'),
            properties: ['openDirectory', 'createDirectory']
        }, function (paths) {
            downloader.savingPath = paths[0] + '/';
            storage.set('download-path', {path: paths[0] + '/'}, function(error) {
                $scope.$apply();
            });
            $scope.$apply();
        });
    };

    ipcRenderer.on('download-end', function(e, b) {
        $scope.$apply();
    });
}]);
fruitsControllers.controller('DossierCtrl', ['$scope', '$rootScope', '$routeParams', 'Dossier',
function($scope, $rootScope, $routeParams, Dossier) {
    $rootScope.page = 'serveurs';
    $rootScope.rechercher = '';

    $scope.dossier = Dossier.get({id: $routeParams.id}, function() {
        $scope.dossier.fichiers.forEach(function(t) {
            t.seuil = $rootScope.seuil();
        });
    });
}]);
fruitsControllers.controller('SearchCtrl', ['$scope', '$rootScope', '$routeParams', 'Search',
function($scope, $rootScope, $routeParams, Search) {
    $rootScope.page = 'serveurs';
    $scope.searchEnCours = true;
    $scope.search = Search.get({q: $routeParams.q}, function() {
        $scope.searchEnCours = false;
    });
}]);
fruitsControllers.controller('NewCtrl', ['$scope', '$rootScope', 'Dossier',
function($scope, $rootScope, Dossier) {
    $rootScope.page = 'new';
    $rootScope.rechercher = '';

    $scope.dossier = Dossier.new();
}]);
fruitsControllers.controller('SuggestCtrl', ['$scope', '$rootScope', 'Suggest',
function($scope, $rootScope, Suggest) {
    $rootScope.page = 'serveurs';
    $rootScope.rechercher = '';
    $scope.searchSuggest = function () {
        $scope.message = '';
        $scope.results = Suggest.get({q: $scope.rechercher});
    };
    $scope.askFor = function (result) {
        Suggest.ask({type: result.media_type, tmdbid: result.id}, function () {
            $scope.message = 'Ta demande a bien été soumise';
            delete $scope.results;
        });
    };
}]);
