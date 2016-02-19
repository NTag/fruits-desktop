module.exports = function(grunt) {

    grunt.initConfig({
        'create-windows-installer': {
            // ia32: {
            //     appDirectory: './Fruits-win32-ia32/',
            //     outputDirectory: 'installers-ia32/',
            //     authors: 'BR',
            //     exe: 'Fruits.exe',
            //     setupIcon: './icon.ico',
            //     loadingGif: './fruits/images/load_big.gif',
            //     remoteReleases: 'http://129.104.201.13/app/updates-windows-ia32/'
            // },
            x64: {
                appDirectory: './Fruits-win32-x64/',
                outputDirectory: 'installers-x64/',
                authors: 'BR',
                exe: 'Fruits.exe',
                setupIcon: './icon.ico',
                loadingGif: './fruits/images/load_big.gif',
                remoteReleases: 'http://129.104.201.13/app/updates-windows-x64/'
            }
        }
    });

    grunt.loadNpmTasks('grunt-electron-installer');

    grunt.registerTask('default', ['create-windows-installer']);

};
