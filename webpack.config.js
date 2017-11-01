/* eslint-env node */
'use strict';

const webpack = require('webpack');
const path = require('path');
const pkg = require('./package.json');

const buildSummary = require('./tasks/getBuildSummary')();
const isProduction = buildSummary.isProduction;

module.exports = {
    entry: {
        app: `./assets/js/main.js`
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
    resolve: {
        alias: {
            // TODO: Change to vue.esm.js when using import/export
            vue$: 'vue/dist/vue.common.js'
        }
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
                new webpack.optimize.UglifyJsPlugin({
                    beautify: false,
                    mangle: {
                        screw_ie8: true,
                        keep_fnames: true
                    },
                    compress: {
                        warnings: false,
                        screw_ie8: true
                    },
                    comments: false,
                    sourceMap: true
                }),
                new webpack.BannerPlugin({
                    banner: `${pkg.description} - ${buildSummary.commitHash}`
                })
            ]);
        }

        return plugins;
    })()
};
