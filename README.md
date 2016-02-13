[![Build Status](https://travis-ci.org/Kitware/npm-dep.svg)](https://travis-ci.org/Kitware/npm-dep)
[![Dependency Status](https://david-dm.org/kitware/npm-dep.svg)](https://david-dm.org/kitware/npm-dep)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
![npm-download](https://img.shields.io/npm/dm/npm-dep.svg)

# Introduction

**npm-dep** provides a way to cache your tools dependencies
on your file system so you don't need to re-download them again
while allowing to share them between projects. 

Currently NPM install all the dependencies from 
**dependencies** and **devDependencies** inside your
**package.json** file at **install** time (npm install).

But what if:

- You just want to install a custom set of dependencies when
  you execute a **run script** (npm run xxx). 

- You don't want to re-download Webpack, PhantomJS, Karma for
  a freshly created project.

- You want to easily check if any new version of a dependency
  is available.

Then maybe **npm-dep** is for you...

# Usage

To enable **npm-dep** inside your package, you simply need to add it to your dependencies and add a new section **dep** inside your **package.json** file
like the following example.

**package.json**
```js
{
    "dependencies": {
        "npm-dep": "latest"
    },
    "dep": {
        "default": {
            "underscore": "1.8.3"
        },
        "test": {
            "expect":"1.13.4",
            "jasmine-core": "2.4.1",
            "jest-cli": "0.8.2",
            "phantomjs": "1.9.19"
        },
        "build": {
            "node-libs-browser": "1.0.0",

            "babel-core": "6.4.5",
            "babel-loader": "6.2.1",
            "babel-preset-es2015": "6.3.13",
            "babel-preset-react": "6.3.13",

            "css-loader": "0.23.1",
            "expose-loader": "0.7.1",
            "file-loader": "0.8.5",
            "json-loader": "0.5.4",
            "style-loader": "0.13.0",
            "url-loader": "0.5.7",

            "webpack": "1.12.12"
        }
    },
    "script": {
        "postinstall": "npm-dep --silent default",
        "pretest": "npm-dep --silent build test",
        "prebuild": "npm-dep --silent build"
    }
}
```

or externalise that information to another file so it could be used
by another project that depend on your **npm-dep** friendly application.

```javascript
# ./config/tools.js
module.exports = {
    
    // Use to build code
    groupNameA: {
        packageName: 'version',
        [...]
    },

    // Use to test section A
    groupNameB: {
        packageName2: 'version54',
        [...]
    }
}

# package.json
{
    [...]

    "config": {
        "npm-dep": {
            "path": "config/tools.js"
        }
    }
}
```

Then when running, **npm-dep** will cache all downloaded packages inside
your ${HOME}/.npm-dep/pkg@ver/... directory and will then copy any 
node_modules/.bin/* and node_modules/* into your local ./node_modules/ directory.

Here is the full list of usage:

```sh
  Usage: npm-dep [options] and/or target1 target2 ...

  Options:

    -h, --help           output usage information
    -V, --version        output the version number

    -c, --check          Check outdated dependencies.
    -p, --check-package  Check package.json dependencies.
    
    -l, --list           List dependency targets.
    -a, --all            Install all target dependencies.
    
    -s, --silent         Silence any output.
```

### Licensing

**npm-dep** is licensed under [BSD Clause 3](LICENSE).

### Getting Involved

Fork our repository and do great things. At [Kitware](http://www.kitware.com),
we've been contributing to open-source software for 15 years and counting, and
want to make **npm-dep** useful to as many people as possible.


