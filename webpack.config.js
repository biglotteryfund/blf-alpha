/* eslint-env node */
'use strict';

const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const path = require('path');
const pkg = require('./package.json');
const { getBuildSummary } = require('./build-helpers');

const buildSummary = getBuildSummary();
const isProduction = buildSummary.isProduction;

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
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    plugins: (function() {
        var plugins = [
            new webpack.DefinePlugin({
                __DEV__: JSON.stringify(JSON.parse(!isProduction || 'false')),
                'process.env': { NODE_ENV: JSON.stringify(process.env.NODE_ENV) }
            })
        ];

        if (isProduction) {
            plugins = plugins.concat([
                new UglifyJsPlugin({
                    sourceMap: true,
                    uglifyOptions: {
                        ecma: 5
                    }
                }),
                new webpack.BannerPlugin({
                    banner: `${pkg.description} - ${buildSummary.commitHash}`
                })
            ]);
        }

        return plugins;
    })()
};
