/* eslint-env node */
'use strict';
const path = require('path');
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

const pkg = require('./package.json');
const { getBuildSummary } = require('./build-helpers');

const buildSummary = getBuildSummary();

const commonConfig = {
    mode: buildSummary.isProduction ? 'production' : 'development',
    performance: {
        hints: buildSummary.isProduction ? 'error' : false
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
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
            path: path.resolve(__dirname, buildSummary.buildDir, 'javascripts')
        },
        devtool: buildSummary.isProduction ? 'source-map' : 'eval-source-map',
        resolve: {
            alias: {
                vue$: 'vue/dist/vue.esm.js'
            }
        },
        plugins: [
            new VueLoaderPlugin(),
            new webpack.BannerPlugin({
                banner: `${pkg.description} - ${buildSummary.commitHash}`
            })
        ]
    })
];
