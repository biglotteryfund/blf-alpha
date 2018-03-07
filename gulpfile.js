'use strict';

const gulp = require('gulp');
const runSequence = require('run-sequence');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const foutWithAClass = require('postcss-fout-with-a-class').default;
const cssnano = require('cssnano');
const sourcemaps = require('gulp-sourcemaps');
const livereload = require('livereload');
const del = require('del');
const fs = require('fs');

const { getBuildSummary } = require('./build-helpers');

const buildSummary = getBuildSummary();

gulp.task('clean', function() {
    return del([buildSummary.buildDirBase + '/**/*', buildSummary.manifestDir]);
});

/**
 * Compile Sass
 */
gulp.task('styles', function() {
    return gulp
        .src(buildSummary.cssInDir + '/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(
            postcss([
                autoprefixer(),
                foutWithAClass({ families: ['Poppins', 'Roboto'], className: 'fonts-loaded' }),
                cssnano()
            ])
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
gulp.task('watch', function() {
    const server = livereload.createServer();
    server.watch(buildSummary.buildDirBase + '/**/*.{css,js}');
    gulp.watch(buildSummary.cssInDir + '/**/*.scss', ['styles']);
});

/**
 * Primary task aliases
 */
gulp.task('build', function(done) {
    runSequence('clean', 'styles', done);
});

gulp.task('default', ['build']);
