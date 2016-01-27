#! /usr/bin/env node

var nodeDir,
    depsToInstall = [],
    nodeModuleDirs = [],
    maxDownloadPool = 4,
    currentPoolSize = 0,
    maxNameSize = 3,
    maxVersionSize = 3,
    lastParentDir = process.env.PWD;

/* global exec exit ls ln mkdir test */
/* eslint-disable vars-on-top */
require('shelljs/global');

var fs = require('fs'),
    path = require('path'),
    program = require('commander'),
    packageJson = require('package-json'),
    pkgJson = require(path.join(process.env.PWD, 'package.json'));

process.title = pkgJson.name;

program
  .version('1.0.0')
  .usage('[options] or target1 target2 ...')

  .option('-c, --check', 'Check outdated dependencies.')
  .option('-p, --check-package', 'Check package.json dependencies.\n')

  .option('-l, --list', 'List dependency targets.')
  .option('-a, --all', 'Install all target dependencies.\n')

  .option('-s, --silent', 'Silence any output.')

  .parse(process.argv);

// Find all parent node_modules
while(lastParentDir !== path.dirname(lastParentDir)) {
    nodeDir = path.join(lastParentDir, 'node_modules');
    try {
        /* eslint-disable no-sync */
        if(fs.statSync(nodeDir).isDirectory()) {
            nodeModuleDirs.push(nodeDir);
        }
        /* eslint-enable no-sync */
    } catch(e) {
        // Directory does not exist
    }
    lastParentDir = path.dirname(lastParentDir)
}

// Show help if no argument provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
    exit(0);
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
    var founds = [];

    nodeModuleDirs.forEach( function(basePath) {
        var packagePathDir = path.join(basePath, name);
        try {
            /* eslint-disable no-sync */
            if(fs.statSync(packagePathDir).isDirectory()) {
                // Check local version compare to requested
                if(require(path.join(packagePathDir, 'package.json')).version === version) {
                    var relativePath = path.relative(process.env.PWD, path.dirname(basePath));
                    founds.push(relativePath.length ? relativePath : '.');
                }
            }
            /* eslint-enable no-sync */
        } catch(e) {
            // Need install...
        }
    });

    return founds.length ? ('('+founds.length+') ' + founds[0]) : null;
}

function consumeNextDependency() {
    if(depsToInstall.length && currentPoolSize < maxDownloadPool) {
        var pkgNameVersion = depsToInstall.pop();
        var nameVersion = pkgNameVersion.split('@');
        var packagePath = findPackage(pkgNameVersion);

        if(!packagePath) {
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
            printProgress(nameVersion[0], nameVersion[1], 'Local ' + packagePath, '- ');
            consumeNextDependency();
        }
    }
}

function linkExecutable(src, dest) {
    if(src !== dest) {
        var binPath = path.join(src, '.bin');
        var execPath = path.join(dest, '.bin');
        mkdir('-p', binPath);
        mkdir('-p', execPath);
        ls(binPath).forEach(function(file) {
            var srcPath = path.join(binPath, file);
            if(test('-e', srcPath)) {
                ln('-sf', srcPath, path.join(execPath, path.basename(file)));
            }
        });
    }
}

function processDependencies() {
    var destDir = nodeModuleDirs[0];

    while(depsToInstall.length && currentPoolSize < maxDownloadPool) {
        consumeNextDependency();
    }

    // Add bin exec from parent
    nodeModuleDirs.forEach(function(src) {
        linkExecutable(src, destDir);
    });
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
    if(pkgJson.dependencies) {
        processDependencyMap(pkgJson.dependencies);
    }
    if(pkgJson.devDependencies) {
        processDependencyMap(pkgJson.devDependencies);
    }

    checkVersion(depsToInstall.pop());
} else if(program.all) {
    Object.keys(pkgJson.dep).forEach( function(group) {
        processDependencyMap(pkgJson.dep[group]);
    });
    processDependencies();
} else if(program.check) {
    var groups = program.args.length ? program.args : Object.keys(pkgJson.dep);
    groups.forEach( function(group) {
        processDependencyMap(pkgJson.dep[group]);
    });

    checkVersion(depsToInstall.pop());
} else if(program.list) {
    console.log('Targets =>', Object.keys(pkgJson.dep).join(', '));
} else if(program.args.length) {
    program.args.forEach( function(group) {
        if(pkgJson.dep[group]) {
            processDependencyMap(pkgJson.dep[group]);
        }
    });
    processDependencies();
}
