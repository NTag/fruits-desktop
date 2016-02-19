# Fruits Desktop

## Installation
Installer les dernières versions de [NodeJS et NPM](https://nodejs.org).  
Installer globalement electron et bower :
```
sudo npm install -g electron-prebuilt bower
```
Installer les dépendances locales :
```
npm install
cd fruits
bower install
```

### WebChimera.js
Pour lire des vidéos dans l'application, on utilise [WebChimera.js](https://github.com/RSATom/WebChimera.js). Il faut aller télécharger une release correspond aux bonnes versions et surtout incluant libVLC (https://github.com/RSATom/WebChimera.js/releases) et la décompresser dans le bon dossier (`wcjs-renderer/node_modules/` actuellement). Voici comment ça se passe :

#### Sous Mac OS X
```
cd nodes_modules
wget https://github.com/RSATom/WebChimera.js/releases/download/v0.2/WebChimera.js_v0.2_electron_v0.36.7_VLC_v2.2.2_x64_osx.tar.gz
cp WebChimera.js_v0.1.48_electron_v0.36.2_VLC_v2.2.1_x64_osx.tar.gz wcjs-renderer/node_modules/
cd wcjs-renderer/node_modules/
rm -rf webchimera.js
tar -xvzf WebChimera.js_v0.1.48_electron_v0.36.2_VLC_v2.2.1_x64_osx.tar.gz
```

#### Sous Windows
Télécharger [la release 64 bits](https://github.com/RSATom/WebChimera.js/releases/download/v0.2/WebChimera.js_v0.2_electron_v0.36.7_VLC_v2.2.2_x64_win.zip) ou [32 bits](https://github.com/RSATom/WebChimera.js/releases/download/v0.2/WebChimera.js_v0.2_electron_v0.36.7_VLC_v2.2.2_ia32_win.zip) en fonction de votre système. Aller dans `nodes_modules/wcjs-renderer/node_modules/`, supprimer le dossier `webchimera.js` s'il existe et décompresser ici l'archive (cela devrait recréer un dossier `webchimera.js`).

#### Sous Linux
Je n'ai pas encore testé. Mais je pense qu'il faut suivre les indications d'ici (https://github.com/RSATom/WebChimera.js#using-prebuilt-on-linux) dans le dossier `nodes_modules/wcjs-renderer`.


## Lancement
Une fois l'installation effectuée, le lancement est assez simple :
```
electron .
```


## Compilation et packagement
Il faut d'abord installer [electron-packager](https://github.com/maxogden/electron-packager) :
```
sudo npm install electron-packager -g
```

### Sous Mac OS X
Le script `build-mac.sh` s'occupe de tout (compilation, décompression de webchimera.js, signature de l'app).

### Sous Windows
Il faut installer grunt, windows-shortcuts, [grunt-electron-installer](https://github.com/atom/grunt-electron-installer) :
```
sudo npm install -g grunt-cli
npm install grunt
npm install windows-shortcuts
npm install grunt-electron-installer
```

Dans `main.js` il faut bien décommenter la ligne concernant `require('windows-shortcuts')`.

Puis on compile l'application (adapter l'architecture) :
```
electron-packager . Fruits --platform=win32 --arch=x64 --version=0.36.3 --overwrite --icon=icon.ico --ignore="(Fruits-darwin-x64|Fruits-win32-ia32|Fruits-win32-x64|installers|installers-ia32|installers-x64)"
```

Puis on crée l'installeur (cette opération peut être assez longue). Décommenter dans `Gruntfile.js` les lignes correspondant à la bonne architecture.
```
grunt
```


## Déployer une mise à jour
### Sous Mac OS X
Il suffit de zipper (clic-droit > compresser) le .app obtenu via `build-mac.sh` et qui doit être signé. Puis l'uploader sur fruits et modifier `api/index.php` pour indiquer le numéro de la dernière version.

### Sous Windows
J'ai l'impression que grunt-electron-installer ne fait pas correctement son travail. Les fichiers NUPKG sont en fait des fichiers zip. C'est normalement les fichiers de delta qui seront téléchargés par Squirrel lors d'une mise à jour. Et ces fichiers zip de delta contiennent un fichier NUSPEC au format XML qui manque d'une section `<releaseNotes>` ce qui empêche Squirrel d'effectuer la mise à jour...  
Du coup, en attendant que ce bug soit corrigé, il faut renommer `Fruits-0.x.0-delta.nupkg` en `Fruits-0.x.0-delta.zip`, le décompression, modifier le fichier .nuspec pour y ajouter une section `<releaseNotes>Des notes de version</releaseNotes>`, puis rezipper tout ça et renommer en .nupkg.  
Ensuite, il faut calculer l'empreinte sha1 de ce fichier (`sha1sum` sous Mac et Linux), regarder le poids du fichier, et modifier la ligne correspondante du fichier `RELEASES`. Puis on peut uploader les nouveaux fichiers .nupkg, Setup.exe, Setup.msi et RELEASES.

Les exécutables Windows ne sont pas signés car ce système est incompréhensible et les certificats très chers.
