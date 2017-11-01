'use strict';

const importLazy = require('import-lazy')(require);
const gulp = require('gulp');
const autoprefixer = importLazy('gulp-autoprefixer');
const del = importLazy('del');
const fs = importLazy('fs');
const jsonSass = importLazy('rootbeer');
const rename = importLazy('gulp-rename');
const runSequence = importLazy('run-sequence');
const sass = importLazy('gulp-sass');
const source = importLazy('vinyl-source-stream');
const sourcemaps = importLazy('gulp-sourcemaps');

const buildSummary = require('./tasks/getBuildSummary')();

const DIRS = {
    in: {
        css: './assets/sass',
        img: './assets/images',
        sassConfig: './config/content'
    }
};

const MANIFEST_PATH = './bin/assets.json';

gulp.task('clean', function() {
    return del([buildSummary.buildDirBase + '/**/*', MANIFEST_PATH]);
});

gulp.task('images', function() {
    return gulp.src(DIRS.in.img + '/**/*').pipe(gulp.dest(buildSummary.buildDir + '/images'));
});

/**
 * Compile scripts via Webpack
 */
gulp.task('scripts', function(cb) {
    require('child_process').exec('$(npm bin)/webpack', function(err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

gulp.task('jsonToSass', function() {
    const jsonPath = DIRS.in.sassConfig + '/sass.json';
    return fs
        .createReadStream(jsonPath)
        .pipe(jsonSass({ prefix: '$appConfig: ' }))
        .pipe(source(jsonPath))
        .pipe(rename('_config.scss'))
        .pipe(gulp.dest(DIRS.in.css));
});

/**
 * Compile static assets.
 * References to images will be replaced
 * in production with cachebusted versions.
 */
gulp.task('styles', ['images', 'jsonToSass'], function() {
    return gulp
        .src(DIRS.in.css + '/*.scss')
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

    fs.writeFile(MANIFEST_PATH, JSON.stringify(manifestData, null, 4), done);
});

/**
 * Watchers
 */
gulp.task('watch', ['build'], function() {
    const livereload = require('livereload');
    const server = livereload.createServer();
    server.watch(buildSummary.buildDirBase + '/**/*.{css,js}');

    gulp.watch(DIRS.in.css + '/**/*.scss', ['styles']);
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
