'use strict';
const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const ipcMain = electron.ipcMain;
const ClientFtp = require('ftp-ct');
const fs = require('fs');
const mkdirp = require('mkdirp');
const autoUpdater = electron.autoUpdater;
const infos = require('./package.json');
// const ws = require('windows-shortcuts');
const cp = require("child_process");

function copyFile(source, target, cb) {
    var cbCalled = false;

    var rd = fs.createReadStream(source);
    rd.on("error", function(err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function(err) {
        done(err);
    });
    wr.on("close", function(ex) {
        done();
    });
    rd.pipe(wr);

    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }
}

var handleStartupEvent = function() {
    if (process.platform !== 'win32') {
        return false;
    }

    var squirrelCommand = process.argv[1];
    switch (squirrelCommand) {
        case '--squirrel-install':
        case '--squirrel-updated':

        // Optionally do things such as:
        //
        // - Install desktop and start menu shortcuts
        // - Add your .exe to the PATH
        // - Write to the registry for things like file associations and
        //   explorer context menus

        copyFile(__dirname + "/Fruits.bat", __dirname + "/../../Fruits.bat", function (e) {
            ws.create("%APPDATA%/Microsoft/Windows/Start Menu/Programs/Fruits.lnk", {
                target: __dirname + "/../../Fruits.bat",
                desc: infos.description,
                icon: __dirname + "/icon.ico",
                workingDir:  __dirname + "/../../"
            }, function(err) {
                console.log(err);
                // Always quit when done
                app.quit();
            });
        });

        return true;
        case '--squirrel-uninstall':
        // Undo anything you did in the --squirrel-install and
        // --squirrel-updated handlers

        // Always quit when done
        app.quit();

        return true;
        case '--squirrel-obsolete':
        // This is called on the outgoing version of your app before
        // we update to the new version - it's the opposite of
        // --squirrel-updated
        app.quit();
        return true;
    }
};

if (handleStartupEvent()) {
    return;
}

if (process.platform == 'win32' && !process.env.VLC_PLUGIN_PATH) {
    fs.stat(__dirname + "/../../Fruits.bat", function(err, stat) {
        if(err == null) {
            cp.spawn(__dirname + "/../../Fruits.bat", {
                detached: true
            });
            app.quit();
        }
    });
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform != 'darwin') {
        app.quit();
    }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
    var updateUrl;
    if (process.platform == 'win32' && process.arch == 'x64') {
        updateUrl = 'http://129.104.201.13/app/updates-windows-x64/';
    } else if (process.platform == 'win32' && process.arch == 'ia32') {
        updateUrl = 'http://129.104.201.13/app/updates-windows-ia32/';
    } else if (process.platform == 'darwin') {
        updateUrl = 'http://129.104.201.13/api/app/check-update?platform=mac&v=' + infos.version;
    }
    if (updateUrl) {
        autoUpdater.setFeedURL(updateUrl);
        autoUpdater.checkForUpdates();
        autoUpdater.on('error', function(error) {
            console.log('error with auto update', error);
        });
        autoUpdater.on('update-available', function() {
            console.log('update available');
        });
        autoUpdater.on('update-downloaded', function(infos) {
            console.log('update downloaded', infos);
        });
    }
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 1300, height: 700});

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/fruits/index.html');

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    ipcMain.on('download-file', function(e, file) {
        var c = new ClientFtp();
        c.on('ready', function() {
            var size = 0;
            var progress = 0;
            c.size(file.path, function (err, s) {
                size = s;
                e.sender.send('download-infos', {size: s});
            });
            mkdirp.sync(file.destinationPath);
            c.get(file.path, function(err, stream) {
                if (err) throw err;
                stream.once('close', function() {
                    console.log('fini');
                    e.sender.send('download-end', true);
                    c.end();
                    ipcMain.removeListener('download-pause', onPause);
                    ipcMain.removeListener('download-resume', onResume);
                });
                // stream.once('end', function() {
                //     e.sender.send('download-end', true);
                //     c.end();
                // });
                stream.once('error', function(e) {
                    console.log(e);
                });
                stream.on('data', function (chunk) {
                    var oldp = progress;
                    progress += chunk.length;
                    if (Math.floor(oldp/size*1000) != Math.floor(progress/size*1000)) {
                        e.sender.send('download-progress', progress);
                    }
                });
                stream.pipe(fs.createWriteStream(file.destinationPath + file.destinationName));
                function onPause(e) {
                    stream.pause();
                    stream.unpipe();
                    stream.pause();
                }
                function onResume(e) {
                    stream.pipe(fs.createWriteStream(file.destinationPath + file.destinationName, {flags: 'a'}));
                    stream.resume();
                }
                ipcMain.on('download-pause', onPause);
                ipcMain.on('download-resume', onResume);
                ipcMain.once('download-abort', function(e) {
                    console.log('abort!');
                    // stream.pause();
                    stream.unpipe();
                    // stream.resume();
                    // stream.pause();
                    c.abort(true, function (e) {
                        console.log('error', e);
                    });
                    c.destroy();
                    c.end();
                    fs.unlink(file.destinationPath + file.destinationName);
                    // e.sender.send('download-end', true);
                });
            });
        });
        c.connect({
            host: file.host,
            user: 'anonymous',
            password: 'fruits@desktop.app',
            debug: function(m) {
                console.log(m);
            }
        });
    });


    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
});
