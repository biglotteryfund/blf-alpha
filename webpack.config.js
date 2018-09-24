/* eslint-env node */
'use strict';
const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const isProduction = process.env.NODE_ENV === 'production';
const pkgConfig = require('./package.json').config;

const babelOptions = {
    plugins: ['syntax-dynamic-import'],
    presets: [
        [
            'env',
            {
                modules: false,
                targets: {
                    browsers: ['>0.25% in GB', 'ie >= 10', 'not op_mini all']
                }
            }
        ]
    ],
    env: {
        test: {
            plugins: ['transform-es2015-modules-commonjs']
        }
    }
};

const commonConfig = {
    mode: isProduction ? 'production' : 'development',
    performance: {
        hints: isProduction ? 'error' : false
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: babelOptions
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            }
        ]
    }
};

module.exports = [
    Object.assign({}, commonConfig, {
        entry: {
            head: './assets/js/head.js'
        },
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, './views/includes/')
        }
    }),
    Object.assign({}, commonConfig, {
        entry: {
            app: './assets/js/main.js',
            styleguide: './assets/js/styleguide.js'
        },
        output: {
            filename: '[name].js',
            chunkFilename: '[name].bundle.js',
            path: path.resolve(__dirname, pkgConfig.dist.js)
        },
        devtool: isProduction ? 'source-map' : 'eval-source-map',
        resolve: {
            alias: {
                vue$: 'vue/dist/vue.esm.js'
            }
        },
        plugins: [new VueLoaderPlugin()]
    })
];
