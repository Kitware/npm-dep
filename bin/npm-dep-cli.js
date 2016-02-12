#! /usr/bin/env node

var fs = require('fs'),
    path = require('path'),
    program = require('commander'),
    packageJson = require('package-json');


var nodeDir,
    pkg = require('../package.json'),
    targetPkg = require( path.join(process.env.PWD, 'package.json')),
    appVersion = /semantically-release/.test(pkg.version) ? 'development version' : pkg.version,
    depsToInstall = [],
    maxDownloadPool = 4,
    currentPoolSize = 0,
    maxNameSize = 3,
    maxVersionSize = 3,
    rootPath = path.join(process.env.HOME, '.npm-dep'),
    workDir = path.join(rootPath, targetPkg.name),
    depGroups = targetPkg.dep;

// Find working directory
if(targetPkg && targetPkg.config && targetPkg.config['npm-dep'] && targetPkg.config['npm-dep'].path) {
    var conf = require(path.join(process.env.PWD, targetPkg.config['npm-dep'].path));
    workDir = path.join(rootPath, conf.name);
    depGroups = conf.dep;
}
/* global exec exit ls ln mkdir test */
/* eslint-disable vars-on-top */
require('shelljs/global');

process.title = pkg.name;

program
  .version(appVersion)
  .usage('[options] or target1 target2 ...')

  .option('-c, --check', 'Check outdated dependencies.')
  .option('-p, --check-package', 'Check package.json dependencies.\n')

  .option('-l, --list', 'List dependency targets.')
  .option('-a, --all', 'Install all target dependencies.\n')

  .option('-s, --silent', 'Silence any output.')

  .parse(process.argv);


// Show help if no argument provided
if (!process.argv.slice(2).length || !depGroups) {
    program.outputHelp();
    exit(0);
} else {
    mkdir('-p', workDir);
    cd(workDir);
}

function expandMaxNameSize(str) {
    maxNameSize = str.length > maxNameSize ? str.length : maxNameSize;
}

function expandVersionSize(str) {
    maxVersionSize = str.length > maxVersionSize ? str.length : maxVersionSize;
}

function printProgress(name, version, action, lineStart) {
    if(program.silent) {
        return;
    }

    var txt = lineStart,
        delta = txt.length + 2;
    txt += name;
    while(txt.length < maxNameSize + delta) {
       txt += ' ';
    }
    txt += version;
    while(txt.length < maxNameSize + maxVersionSize + delta + 2) {
       txt += ' ';
    }
    txt += action;
    console.log(txt);
}

function findPackage(pkgNameVersion) {
    var name = pkgNameVersion.split('@')[0];
    var version = pkgNameVersion.split('@')[1];

    var packagePathDir = path.join(workDir, 'node_modules', name);
    try {
        /* eslint-disable no-sync */
        if(fs.statSync(packagePathDir).isDirectory()) {
            // Check local version compare to requested
            if(require(path.join(packagePathDir, 'package.json')).version === version) {
                return true;
            }
        }
        /* eslint-enable no-sync */
    } catch(e) {
        // Need install...
    }

    return false;
}

function linkMissing(src, dest) {
    var srcPackages = ls(src);
    var destPackages = ls(dest);
    var keep = srcPackages.filter(function(i) {
        return (destPackages.indexOf(i) === -1);
    });

    keep.forEach( function(name) {
        cp('-r', path.join(src, name), path.join(dest, name));
    });
}

function consumeNextDependency() {
    if(depsToInstall.length && currentPoolSize < maxDownloadPool) {
        var pkgNameVersion = depsToInstall.pop();
        var nameVersion = pkgNameVersion.split('@');
        var foundPackage = findPackage(pkgNameVersion);

        if(!foundPackage) {
            currentPoolSize++;
            printProgress(nameVersion[0], nameVersion[1], 'Download', '+ ');
            exec('npm install ' + pkgNameVersion,
                {silent:true},
                function(code, stdout, stderr) {
                    currentPoolSize--;
                    if(code!== 0) {
                        console.log('Error with', pkgNameVersion);
                        console.log(stderr);
                    }
                    consumeNextDependency();
                }
            );
        } else {
            printProgress(nameVersion[0], nameVersion[1], 'Local', '- ');
            consumeNextDependency();
        }
    } else {
        // Add missing pieces
        ['node_modules', 'node_modules/.bin'].forEach(function(subDir) {
           linkMissing(path.join(workDir, subDir), path.join(process.env.PWD, subDir));
        })
    }
}



function processDependencies() {
    mkdir('-p', path.join(process.env.PWD,'node_modules/.bin'));
    while(depsToInstall.length && currentPoolSize < maxDownloadPool) {
        consumeNextDependency();
    }
}

function processDependencyMap(depMap) {
    Object.keys(depMap).forEach(function(name) {
        var version = depMap[name];
        expandMaxNameSize(name);
        expandVersionSize(version);
        depsToInstall.push([name, version].join('@'))
    });
}

function checkVersion(entry) {
    var name = entry.split('@')[0],
        version = entry.split('@')[1];

    packageJson(name, 'latest').then(function(json){
        printProgress(json.name, version, json.version, (version === json.version) ? '💚  ' : '💔  ');
        if(depsToInstall.length) {
            checkVersion(depsToInstall.pop());
        }
    });
}

// Start execution
if(program.checkPackage) {
    if(targetPkg.dependencies) {
        processDependencyMap(targetPkg.dependencies);
    }
    if(targetPkg.devDependencies) {
        processDependencyMap(targetPkg.devDependencies);
    }

    checkVersion(depsToInstall.pop());
} else if(program.all) {
    Object.keys(depGroups).forEach( function(group) {
        processDependencyMap(depGroups[group]);
    });
    processDependencies();
} else if(program.check) {
    var groups = program.args.length ? program.args : Object.keys(depGroups);
    groups.forEach( function(group) {
        processDependencyMap(depGroups[group]);
    });

    checkVersion(depsToInstall.pop());
} else if(program.list) {
    console.log('Targets =>', Object.keys(depGroups).join(', '));
} else if(program.args.length) {
    program.args.forEach( function(group) {
        if(depGroups[group]) {
            processDependencyMap(depGroups[group]);
        }
    });
    processDependencies();
}
