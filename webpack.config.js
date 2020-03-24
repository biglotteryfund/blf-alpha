/* eslint-env node */
'use strict';
const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

const isProduction = process.env.NODE_ENV === 'production';
const pkg = require('./package.json');
const pkgConfig = pkg.config;

module.exports = {
    mode: isProduction ? 'production' : 'development',
    performance: {
        hints: isProduction ? 'error' : false,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
        ],
    },
    entry: {
        head: './assets/js/head.js',
        app: [
            'core-js/modules/es6.promise',
            'core-js/modules/es6.array.iterator',
            './assets/js/main.js',
        ],
    },
    output: {
        filename: '[name].js',
        chunkFilename: '[name][chunkhash].js',
        path: path.resolve(__dirname, pkgConfig.dist.js),
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    resolve: {
        alias: {
            vue$: 'vue/dist/vue.esm.js',
        },
    },
    plugins: [new VueLoaderPlugin()],
};
