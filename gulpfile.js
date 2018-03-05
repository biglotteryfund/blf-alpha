'use strict';

const gulp = require('gulp');
const runSequence = require('run-sequence');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const livereload = require('livereload');
const del = require('del');
const fs = require('fs');
const { exec } = require('child_process');

const { getBuildSummary } = require('./build-helpers');

const buildSummary = getBuildSummary();

gulp.task('clean', function() {
    return del([buildSummary.buildDirBase + '/**/*', buildSummary.manifestDir]);
});

/**
 * Compile scripts via Webpack
 */
gulp.task('scripts', function(cb) {
    exec('$(npm bin)/webpack', function(err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

/**
 * Compile Sass
 */
gulp.task('styles', function() {
    return gulp
        .src(buildSummary.cssInDir + '/*.scss')
        .pipe(sourcemaps.init())
        .pipe(
            sass({
                outputStyle: buildSummary.isProduction ? 'compressed' : 'expanded'
            }).on('error', sass.logError)
        )
        .pipe(
            autoprefixer({
                browsers: ['last 2 versions'],
                cascade: false
            })
        )
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(buildSummary.buildDir + '/stylesheets'));
});

gulp.task('manifest', function(done) {
    const manifestData = {
        version: buildSummary.buildVersion
    };

    fs.writeFile(buildSummary.manifestDir, JSON.stringify(manifestData, null, 4), done);
});

/**
 * Watchers
 */
gulp.task('watch', ['build'], function() {
    const server = livereload.createServer();
    server.watch(buildSummary.buildDirBase + '/**/*.{css,js}');
    gulp.watch(buildSummary.cssInDir + '/**/*.scss', ['styles']);
});

/**
 * Primary task aliases
 */
gulp.task('build', function(done) {
    runSequence('clean', 'styles', 'scripts', done);
});

gulp.task('build:production', function(done) {
    runSequence('build', 'manifest', done);
});

gulp.task('default', ['build']);
