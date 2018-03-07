/* eslint-env node */
'use strict';

const webpack = require('webpack');

const path = require('path');
const pkg = require('./package.json');
const { getBuildSummary } = require('./build-helpers');

const buildSummary = getBuildSummary();

const commonConfig = {
    performance: {
        hints: buildSummary.isProduction ? 'error' : false
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
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
            path: path.resolve(__dirname, buildSummary.buildDir, 'javascripts'),
            publicPath: `${buildSummary.publicDir}/javascripts/`
        },
        resolve: {
            alias: {
                vue$: 'vue/dist/vue.esm.js'
            }
        },
        plugins: [
            new webpack.BannerPlugin({
                banner: `${pkg.description} - ${buildSummary.commitHash}`
            })
        ]
    })
];
