#!/bin/bash
rm -rf node_modules/wcjs-renderer/node_modules/webchimera.js
electron-packager . Fruits --platform=darwin --arch=x64 --version=0.36.3 --overwrite --icon=icon.icns
cd Fruits-darwin-x64/Fruits.app/Contents/Resources/app/node_modules
cp WebChimera.js_v0.1.48_electron_v0.36.2_VLC_v2.2.1_x64_osx.tar.gz wcjs-renderer/node_modules/
rm WebChimera.js_v0.1.48_electron_v0.36.2_VLC_v2.2.1_x64_osx.tar.gz
cd wcjs-renderer/node_modules/
rm -rf webchimera.js
tar -xvzf WebChimera.js_v0.1.48_electron_v0.36.2_VLC_v2.2.1_x64_osx.tar.gz
rm WebChimera.js_v0.1.48_electron_v0.36.2_VLC_v2.2.1_x64_osx.tar.gz
cd ../../../../../../../
codesign --deep --force --verbose --sign "Developer ID Application: Basile Bruneau (AMUHMJ9M8F)" Fruits.app
cd ../node_modules
cp WebChimera.js_v0.1.48_electron_v0.36.2_VLC_v2.2.1_x64_osx.tar.gz wcjs-renderer/node_modules/
cd wcjs-renderer/node_modules/
rm -rf webchimera.js
tar -xvzf WebChimera.js_v0.1.48_electron_v0.36.2_VLC_v2.2.1_x64_osx.tar.gz
rm WebChimera.js_v0.1.48_electron_v0.36.2_VLC_v2.2.1_x64_osx.tar.gz
