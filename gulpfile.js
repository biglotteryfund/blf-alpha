/* jshint node: true */
'use strict';

const browserify = require('browserify');
const gulp = require('gulp');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const del = require('del');
const livereload = require('gulp-livereload');
const rev = require('gulp-rev');
const revcssurls = require('gulp-rev-css-url');
const revdel = require('gulp-rev-delete-original');
const autoprefixer = require('gulp-autoprefixer');
const argv = require('yargs').argv;
const gulpif = require('gulp-if');
const eslint = require('gulp-eslint');
const babel = require('gulp-babel');
const babelify = require('babelify');
const mocha = require('gulp-mocha');
const rename = require("gulp-rename");
const mochaPhantomJS = require('gulp-mocha-phantomjs');

// define main directories
const inputBase  = './assets/';
const outputBase = './public/';
const testBase = './test/';
const binBase = './bin/';

// outline where static files live (or end up)
const DIRS = {
    in: {
        root: inputBase,
        css:  inputBase + 'sass',
        js:   inputBase + 'js',
        img:  inputBase + 'img',
        test: testBase
    },
    out: {
        root: outputBase,
        css:  outputBase + 'stylesheets',
        js:   outputBase + 'javascripts',
        img:  outputBase + 'images',
        test: outputBase + 'tests',
        manifest: binBase
    }
};

// define specific names for in/out files
const FILES = {
    in: {
        js: 'main.js',
        css: 'main.scss',
        test: 'test-main.js'
    },
    out: {
        js: 'app.js',
        css: 'style.css',
        test: 'specs.js'
    },
    assets: 'assets.json'
};

// clean out folders of generated assets
gulp.task('clean:css', function() { return del([DIRS.out.css + '/**/*']); });
gulp.task('clean:js', function()  { return del([DIRS.out.js + '/**/*']); });
gulp.task('clean:img', function() { return del([DIRS.out.img + '/**/*']); });
gulp.task('clean:assets', function() { return del([DIRS.out.manifest + '/' + FILES.assets]); });
gulp.task('clean:test', function() { return del([DIRS.out.test + '/**/*']); });

// copy images to public dir
gulp.task('copy:img', ['clean:img'], function() {
    return gulp.src(DIRS.in.img + '/**/*').pipe(gulp.dest(DIRS.out.img));
});

// compile JS
gulp.task('scripts', ['clean:assets', 'clean:js'], function() {
    return browserify({ debug: true })
        .transform(babelify)
        .require(DIRS.in.js + '/' + FILES.in.js, { entry: true })
        .bundle()
        .on('error', function handleError(err) {
            console.error(err.toString());
            this.emit('end');
        })
        .pipe(source(FILES.out.js))
        .pipe(buffer())
        .pipe(gulpif(argv.production, uglify()))
        .pipe(gulp.dest(DIRS.out.js))
        .pipe(livereload());
});

// compile JavaScript module tests for phantomjs below
gulp.task('test-scripts', ['clean:test'], function() {
    return browserify({ debug: true })
        .transform(babelify)
        .require(DIRS.in.test + '/specs/' + FILES.in.test, { entry: true })
        .bundle()
        .on('error', function handleError(err) {
            console.error(err.toString());
            this.emit('end');
        })
        .pipe(source(FILES.out.test))
        .pipe(buffer())
        .pipe(gulp.dest(DIRS.out.test));
});

// compile Sass (after cleaning and moving images)
// references to images will be replaced (on --production/LIVE)
// with cachebusted versions
gulp.task('styles', ['clean:assets', 'clean:css', 'clean:img', 'copy:img'], function() {
    return gulp.src(DIRS.in.css + '/' + FILES.in.css)
        .pipe(gulpif(!argv.production, sourcemaps.init()))
        .pipe(sass({
            outputStyle: 'compressed'
        }).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(sourcemaps.write())
        .pipe(rename(FILES.out.css))
        .pipe(gulp.dest(DIRS.out.css))
        .pipe(livereload());
});

// hash/version static files and replace image paths in CSS
// then write an output file (only on LIVE)
gulp.task('rev', ['styles', 'scripts'], function() {
    return gulp.src([
            DIRS.out.css + '/**/*',
            DIRS.out.js + '/**/*',
            DIRS.out.img + '/**/*'
        ], { base: DIRS.out.root }).pipe(rev())
        .pipe(revcssurls())
        .pipe(revdel())
        .pipe(gulp.dest(DIRS.out.root))
        .pipe(rev.manifest(FILES.assets))
        .pipe(gulp.dest(DIRS.out.manifest));
});

// run mocha tests
gulp.task('mocha', ['build'], function () {
   return gulp.src(testBase + '/test.js', {
       read: false
   }).pipe(mocha({
       reporter: 'spec'
   }));
});

// run phantomjs
gulp.task('phantomjs', ['test-scripts'], function () {
    return gulp
        .src(testBase + '/runner.html')
        .pipe(mochaPhantomJS());
});

// run eslint
gulp.task('lint', function() {
    return gulp.src([
        DIRS.in.js + '/**/*.js',
        '!' + DIRS.in.js + '/libs/',
        '!' + DIRS.in.js + '/libs/**'
    ])
    .pipe(eslint({}))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

// dev task: start the server and watch for changes
gulp.task('default', ['clean:assets', 'dev']);

// used for local dev testing (doesn't version files)
gulp.task('dev', ['styles', 'scripts', 'watch']);

// used on LIVE (add --production flag to uglify files)
gulp.task('build', ['styles', 'scripts', 'rev']);

gulp.task('build-dev', ['styles', 'scripts']);

// used on commit
gulp.task('test', ['lint', 'mocha', 'phantomjs']);

// watch static files for changes and recompile
gulp.task('watch', function() {
    livereload.listen();
    gulp.watch(DIRS.in.css + '/**/*.scss', ['styles']);
    gulp.watch(DIRS.in.js + '/**/*.js', ['scripts']);
});

gulp.task('watch-test', function() {
    gulp.watch(DIRS.in.test + '/**/*.js', ['phantomjs']);
});
