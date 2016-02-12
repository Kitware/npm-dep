module.exports = {
    name: 'example',
    dep: {
        build: {
            "node-libs-browser": "1.0.0",

            "babel-core": "6.4.5",
            "babel-eslint": "5.0.0-beta9",
            "babel-loader": "6.2.1",
            "babel-preset-es2015": "6.3.13",
            "babel-preset-react": "6.3.13",

            "eslint": "1.10.3",
            "eslint-loader": "1.2.1",
            "eslint-plugin-babel": "3.0.0",
            "eslint-plugin-react": "3.16.1",

            "autoprefixer": "6.3.1",
            "autoprefixer-loader": "3.2.0",
            "css-loader": "0.23.1",
            "expose-loader": "0.7.1",
            "file-loader": "0.8.5",
            "html-loader": "0.4.0",
            "json-loader": "0.5.4",
            "postcss-loader": "0.8.0",
            "shader-loader": "1.1.4",
            "style-loader": "0.13.0",
            "url-loader": "0.5.7",

            "html-webpack-plugin": "2.7.2",

            "webpack": "1.12.12",
            "webpack-dev-server": "1.14.1"
        },
        deploy: {
            "commitizen": "2.5.0",
            "semantic-release": "4.3.5",
            "tonic-site-generator": "0.2.2"
        },
        karmaBug: {
            "socket.io": "1.3.7"
        },
        test: {
            "istanbul":"0.4.2",
            "istanbul-instrumenter-loader": "0.1.3",

            "expect":"1.13.4",
            "jasmine-core": "2.4.1",
            "jest-cli": "0.8.2",
            "phantomjs": "1.9.19",

            "karma": "0.13.19",
            "karma-chrome-launcher": "0.2.2",
            "karma-cli": "0.1.2",
            "karma-coverage" : "0.5.3",
            "karma-firefox-launcher": "0.1.7",
            "karma-jasmine": "0.3.6",
            "karma-phantomjs-launcher": "0.2.3",
            "karma-safari-launcher": "0.1.1",
            "karma-sourcemap-loader": "0.3.7",
            "karma-webpack": "1.7.0"
        },
        "utils": {
            "serve": "1.4.0",
            "shelljs": "0.5.3"
        }
    }
}
