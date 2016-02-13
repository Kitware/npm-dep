#! /usr/bin/env node

// ----------------------------------------------------------------------------
/* global exec exit ls ln mkdir test */
/* eslint-disable vars-on-top        */
// ----------------------------------------------------------------------------

require('shelljs/global');

// ----------------------------------------------------------------------------
var fs = require('fs'),
    path = require('path'),
    program = require('commander'),
    packageJson = require('package-json'),

    // npm-dep version extract
    npmDepPKG = require('../package.json');
    npmDepVersion = /semantically-release/.test(npmDepPKG.version) ? 'development version' : npmDepPKG.version,

    // List of package to install
    rootPath = path.join(process.env.HOME, '.npm-dep'),
    pkgToInstall = [],

    // Output handling
    maxNameSize = 3,
    maxVersionSize = 3,

    // Download queue management
    maxDownloadPool = 4,
    currentPoolSize = 0,

    // package.json to process
    targetPKG = require(path.join(process.env.PWD, 'package.json')),
    cacheConfig = targetPKG.dep,
    targetNodeModules = path.join(process.env.PWD, 'node_modules'),
    targetBin = path.join(process.env.PWD, 'node_modules', '.bin');

// ----------------------------------------------------------------------------

// Load cacheConfig if not part of package.json
if(targetPKG && targetPKG.config && targetPKG.config['npm-dep'] && targetPKG.config['npm-dep'].path) {
    cacheConfig = require(path.join(process.env.PWD, targetPKG.config['npm-dep'].path));
}

// ----------------------------------------------------------------------------

process.title = targetPKG.name;

program
  .version(npmDepVersion)
  .usage('[options] or target1 target2 or install')

  .option('-c, --check', 'Check outdated dependencies.')
  .option('-p, --check-package', 'Check package.json dependencies.\n')

  .option('-l, --list', 'List dependency targets.')
  .option('-a, --all', 'Install all target dependencies.\n')

  .option('-s, --silent', 'Silence any output.')

  .parse(process.argv);


// Show help if no argument provided
if (!process.argv.slice(2).length || !cacheConfig) {
    program.outputHelp();
    exit(0);
} else {
    mkdir('-p', targetBin);
}

function expandTextSize(name, version) {
    maxNameSize = name.length > maxNameSize ? name.length : maxNameSize;
    maxVersionSize = version.length > maxVersionSize ? version.length : maxVersionSize;
}

function printProgress(pkgNameVersion, action, lineStart) {
    if(program.silent) {
        return;
    }

    var nameVersion = pkgNameVersion.split('@'),
        txt = lineStart,
        delta = txt.length + 2;

    txt += nameVersion[0];
    while(txt.length < maxNameSize + delta) {
       txt += ' ';
    }
    txt += nameVersion[1];
    while(txt.length < maxNameSize + maxVersionSize + delta + 2) {
       txt += ' ';
    }
    txt += action;
    console.log(txt);
}

function isPackageAvailable(pkgNameVersion) {
    return test('-d', path.join(rootPath, pkgNameVersion));
}

function installPackage(pkgNameVersion) {
    var srcModulePath = path.join(rootPath, pkgNameVersion, 'node_modules'),
        srcBinPath = path.join(rootPath, pkgNameVersion, 'node_modules/.bin');

    cd(srcModulePath);
    ls().forEach(function(name) {
        if(!test('-d', path.join(targetNodeModules, name))) {
            cp('-r', name, targetNodeModules);
        }
    });

    if(test('-d', srcBinPath)) {
        cd(srcBinPath);
        ls().forEach(function(name) {
            if(!test('-e', path.join(targetBin, name))) {
                cp(name, targetBin);
            }
        });
    }
}

function downloadPackage(pkgNameVersion, onDone) {
    var basePath = path.join(rootPath, pkgNameVersion);
    mkdir('-p', basePath);
    cd(basePath);
    exec('npm install ' + pkgNameVersion,
        {silent:true},
        function(code, stdout, stderr) {
            if(code!== 0) {
                console.log('Error with', pkgNameVersion);
                console.log(stderr);
            }
            onDone();
        }
    );
}

function consumeNextDependency() {
    if(pkgToInstall.length && currentPoolSize < maxDownloadPool) {
        var pkgNameVersion = pkgToInstall.pop();

        if(isPackageAvailable(pkgNameVersion)) {
            printProgress(pkgNameVersion, 'Local', '- ');
            installPackage(pkgNameVersion);
            consumeNextDependency();
        } else {
            currentPoolSize++;
            printProgress(pkgNameVersion, 'Download', '+ ');
            downloadPackage(pkgNameVersion, function(){
                currentPoolSize--;
                installPackage(pkgNameVersion);
                consumeNextDependency();
            })
        }
    }
}

function processDependencies() {
    while(pkgToInstall.length && currentPoolSize < maxDownloadPool) {
        consumeNextDependency();
    }
}

function processDependencyMap(cacheGroup) {
    Object.keys(cacheGroup).forEach(function(name) {
        expandTextSize(name, cacheGroup[name]);
        pkgToInstall.push([name, cacheGroup[name]].join('@'))
    });
}

function checkVersion(entry) {
    var name = entry.split('@')[0],
        version = entry.split('@')[1];

    packageJson(name, 'latest').then(function(json){
        printProgress(entry, json.version, (version === json.version) ? '💚  ' : '💔  ');
        if(pkgToInstall.length) {
            checkVersion(pkgToInstall.pop());
        }
    });
}

// Start execution
if(program.checkPackage) {
    if(targetPKG.dependencies) {
        processDependencyMap(targetPKG.dependencies);
    }
    if(targetPKG.devDependencies) {
        processDependencyMap(targetPKG.devDependencies);
    }

    checkVersion(pkgToInstall.pop());
} else if(program.all) {
    Object.keys(cacheConfig).forEach( function(group) {
        processDependencyMap(cacheConfig[group]);
    });
    processDependencies();
} else if(program.check) {
    var groups = program.args.length ? program.args : Object.keys(cacheConfig);
    groups.forEach( function(group) {
        processDependencyMap(cacheConfig[group]);
    });

    checkVersion(pkgToInstall.pop());
} else if(program.list) {
    console.log('Targets =>', Object.keys(cacheConfig).join(', '));
} else if(program.args.length) {
    program.args.forEach( function(group) {
        if(cacheConfig[group]) {
            processDependencyMap(cacheConfig[group]);
        } else if (group === 'install' || group === 'i') {
            if(targetPKG.dependencies) {
                processDependencyMap(targetPKG.dependencies);
            }
            if(targetPKG.devDependencies) {
                processDependencyMap(targetPKG.devDependencies);
            }
        }
    });
    processDependencies();
}
