# Introduction

**npm-dep** provides a more flexible mechanism to install 
dependencies than the standard behavior of NPM.

Currently NPM install all the dependencies from 
**dependencies** and **devDependencies** inside your
**package.json** file at **install** time (npm install).

But what if:

- You just want to install a custom set of dependencies when
  you execute a **run script** (npm run xxx). 

- You don't want to re-install any dependency that is actually
  available on any parent **node_modules** directory.

- You want to easily check if any new version of a dependency is available.

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

# Best practice

This section is more about me sharing my way of using it
than me trying to convert you into using it. But if I find
some benefit in it, you might also find some.

First of all I have several web project that I concurrently
work on and I want to share as much as possible setup, and
build/test dependencies and finally I want to easily upgrade versions
across them.

To achieve that, I create a root/empty project from which I will declare
all my common dependencies inside a **package.json** using the **npm-dep**
sctructure. Then I rely on **npm-dep** for installing all of them at the 
**postinstall** stage.

Then for each new development, I start working in a child directory
(new clone of the git repo).
Then to allow easy update from the root to the children, I use the
exact same **npm-dep** section inside my children projects which
allow me to quickly copy/paste any fix I have done into my root one.
(This part could/should be automated with additional work on npm-dep)

For any specific project depedency, I rely on the standard NPM
behavior with **dependencies** and **devDependencies**.

This way, I never re-download my big dependencies and I don't pollute
my environement using the **global** flag when installing them.

Moreover, if anyone, checkout a project that rely on npm-check without
any parent container, everything will still work as it is supposed to do.

### Licensing

**npm-dep** is licensed under [BSD Clause 3](LICENSE).

### Getting Involved

Fork our repository and do great things. At [Kitware](http://www.kitware.com),
we've been contributing to open-source software for 15 years and counting, and
want to make **npm-dep** useful to as many people as possible.



