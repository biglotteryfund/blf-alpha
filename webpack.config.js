/* eslint-env node */
'use strict';

const webpack = require('webpack');

const path = require('path');
const pkg = require('./package.json');
const { getBuildSummary } = require('./build-helpers');

const buildSummary = getBuildSummary();

module.exports = {
    entry: {
        app: `./assets/js/main.js`,
        styleguide: './assets/js/styleguide.js'
    },
    output: {
        filename: '[name].js',
        chunkFilename: '[name].bundle.js',
        path: path.resolve(__dirname, buildSummary.buildDir, 'javascripts'),
        publicPath: `${buildSummary.publicDir}/javascripts/`
    },
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
    },
    plugins: [
        new webpack.BannerPlugin({
            banner: `${pkg.description} - ${buildSummary.commitHash}`
        })
    ]
};
