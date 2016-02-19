'use strict';

/* Directives */

fruitsApp.directive('keyTrap', function($rootScope, $location, $filter, wcplayer) {
    return function(scope, elem) {
        var pages = {1:'films', 2:'series', 3: 'new', 4:'serveurs'};
        var reverse = {'films':1, 'series':2, 'new':3, 'serveurs':4};
        elem.bind('keypress', function(event) {
            if (wcplayer.displayed) {
                var subtitlesCss = $("head").children(':last');
                var currentSize = parseFloat(subtitlesCss.html().match(/([0-9]+)/gm));
                if (event.keyCode == 43) { // +
                    subtitlesCss.html(".wcp-subtitle-text { font-size: " + (currentSize+5) + "px !important; }");
                } else if (event.keyCode == 45) { // -
                    subtitlesCss.html(".wcp-subtitle-text { font-size: " + Math.max(5, (currentSize-5)) + "px !important; }");
                }
            }
        });
        elem.bind('keydown', function(event) {
            if (wcplayer.displayed) {
                if (event.keyCode == 32 || event.keyCode == 75) { // Space || K
                    wcplayer.player.togglePause();
                    wcplayer.player.animatePause();
                } else if (event.keyCode == 70) { // F
                    wcplayer.toggleFullscreen();
                } else if (event.keyCode == 37 || event.keyCode == 39) { // Left arrow or right arrow
                    var duration = 30;
                    if (event.shiftKey && event.altKey) {
                        duration = 300;
                    } else if (event.shiftKey) {
                        duration = 3;
                    } else if (event.altKey) {
                        duration = 10;
                    } else if (event.ctrlKey) {
                        duration = 60;
                    }
                    duration *= 1000;
                    if (event.keyCode == 37) {
                        duration *= -1;
                    }
                    var newtime = Math.max(0, wcplayer.player.time() + duration);
                    if (newtime >= wcplayer.player.length()) {
                        newtime = wcplayer.player.time();
                    }
                    wcplayer.player.notify($filter('durees')(Math.floor(newtime/1000)) + ' / ' + $filter('durees')(wcplayer.player.length()/1000));
                    wcplayer.player.time(newtime);
                } else if (event.keyCode == 86) { // V
                    wcplayer.player.subTrack((wcplayer.player.subTrack() + 1) % wcplayer.player.subCount());
                    var msg = "Subtitles: ";
                    if (wcplayer.player.subTrack() == 0) {
                        msg += "off";
                    } else {
                        msg += wcplayer.player.subDesc(wcplayer.player.subTrack()).language;
                    }
                    wcplayer.player.notify(msg);
                } else if (event.keyCode == 66) { // B
                    if (wcplayer.player.audioCount() <= 2) {
                        wcplayer.player.notify("No other audio available");
                        return;
                    }
                    wcplayer.player.audioTrack(1 + (wcplayer.player.audioTrack() % (wcplayer.player.audioCount()-1)));
                    var msg = "Audio: " + wcplayer.player.audioDesc(wcplayer.player.audioTrack());
                    wcplayer.player.notify(msg);
                } else if (event.keyCode == 72) { // H
                    wcplayer.player.subDelay(wcplayer.player.subDelay() + 50);
                    wcplayer.player.notify("Subtitles delay: " + wcplayer.player.subDelay() + " ms");
                } else if (event.keyCode == 71) { // H
                    wcplayer.player.subDelay(wcplayer.player.subDelay() - 50);
                    wcplayer.player.notify("Subtitles delay: " + wcplayer.player.subDelay() + " ms");
                }
            } else if (document.getElementById('rechercher').value.length == 0 || document.activeElement != document.getElementById('rechercher')) {
                if (event.keyCode == 37) { // Left arrow
                    if ($rootScope.page != 'films') {
                        $location.path('/' + pages[reverse[$rootScope.page]-1]);
                    }
                } else if (event.keyCode == 39) { // Right arrow
                    if ($rootScope.page != 'serveurs') {
                        $location.path('/' + pages[reverse[$rootScope.page]+1]);
                    }
                }
                scope.$apply();
            }
        });
    };
});
