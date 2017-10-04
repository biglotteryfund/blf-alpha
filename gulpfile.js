'use strict';

const importLazy = require('import-lazy')(require);
const browserify = importLazy('browserify');
const envify = require('envify/custom');
const gulp = importLazy('gulp');
const source = importLazy('vinyl-source-stream');
const buffer = importLazy('vinyl-buffer');
const uglify = importLazy('gulp-uglify');
const sourcemaps = importLazy('gulp-sourcemaps');
const sass = importLazy('gulp-sass');
const del = importLazy('del');
const livereload = importLazy('gulp-livereload');
const rev = importLazy('gulp-rev');
const revcssurls = importLazy('gulp-rev-css-url');
const revdel = importLazy('gulp-rev-delete-original');
const autoprefixer = importLazy('gulp-autoprefixer');
const argv = importLazy('yargs').argv;
const gulpif = importLazy('gulp-if');
const eslint = importLazy('gulp-eslint');
const babelify = importLazy('babelify');
const mocha = importLazy('gulp-mocha');
const rename = importLazy('gulp-rename');
const mochaPhantomJS = importLazy('gulp-mocha-phantomjs');
const jsonSass = importLazy('rootbeer');
const fs = importLazy('fs');

// define main directories
const inputBase = './assets/';
const outputBase = './public/';
const testBase = './test/';
const binBase = './bin/';

// outline where static files live (or end up)
const DIRS = {
    in: {
        root: inputBase,
        css: inputBase + 'sass',
        js: inputBase + 'js',
        img: inputBase + 'images',
        test: testBase,
        sassConfig: './config/content'
    },
    out: {
        root: outputBase,
        css: outputBase + 'stylesheets',
        js: outputBase + 'javascripts',
        img: outputBase + 'images',
        test: outputBase + 'tests',
        manifest: binBase
    }
};

// define specific names for in/out files
const FILES = {
    in: {
        js: 'main.js',
        css: 'main.scss',
        test: 'test-main.js',
        sassConfig: 'sass.json'
    },
    out: {
        js: 'app.js',
        css: 'style.css',
        test: 'specs.js',
        sassConfig: '_config.scss'
    },
    assets: 'assets.json'
};

// clean out folders of generated assets
gulp.task('clean:css', function() {
    return del([DIRS.out.css + '/**/*']);
});
gulp.task('clean:js', function() {
    return del([DIRS.out.js + '/**/*']);
});
gulp.task('clean:img', function() {
    return del([DIRS.out.img + '/**/*']);
});
gulp.task('clean:assets', function() {
    return del([DIRS.out.manifest + '/' + FILES.assets]);
});
gulp.task('clean:test', function() {
    return del([DIRS.out.test + '/**/*']);
});

// copy images to public dir
gulp.task('copy:img', ['clean:img'], function() {
    return gulp.src(DIRS.in.img + '/**/*').pipe(gulp.dest(DIRS.out.img));
});

// compile JS
gulp.task('scripts', ['clean:assets', 'clean:js'], function() {
    const nodeEnv = argv.production ? 'production' : 'development';
    return browserify({ debug: true })
        .transform(
            envify({
                NODE_ENV: nodeEnv
            }),
            {
                global: true,
                _: 'purge'
            }
        )
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

const jsonToSassTask = 'jsonToSass';
const sassTaskBaseDeps = ['clean:assets', 'clean:css', 'clean:img', 'copy:img'];
const sassTaskDeps = sassTaskBaseDeps.concat([jsonToSassTask]);

// we share sass task deps here
// otherwise race conditions mean some images aren't copied etc
gulp.task(jsonToSassTask, sassTaskBaseDeps, function() {
    const jsonPath = DIRS.in.sassConfig + '/' + FILES.in.sassConfig;
    return fs
        .createReadStream(jsonPath)
        .pipe(jsonSass({ prefix: '$appConfig: ' }))
        .pipe(source(jsonPath))
        .pipe(rename(FILES.out.sassConfig))
        .pipe(gulp.dest(DIRS.in.css));
});

// compile Sass (after cleaning and moving images)
// references to images will be replaced (on --production/LIVE)
// with cachebusted versions
gulp.task('styles', sassTaskDeps, function() {
    return gulp
        .src(DIRS.in.css + '/' + FILES.in.css)
        .pipe(gulpif(!argv.production, sourcemaps.init()))
        .pipe(
            sass({
                outputStyle: 'compressed'
            }).on('error', sass.logError)
        )
        .pipe(
            autoprefixer({
                browsers: ['last 2 versions'],
                cascade: false
            })
        )
        .pipe(sourcemaps.write())
        .pipe(rename(FILES.out.css))
        .pipe(gulp.dest(DIRS.out.css))
        .pipe(livereload());
});

// hash/version static files and replace image paths in CSS
// then write an output file (only on LIVE)
gulp.task('rev', ['styles', 'scripts'], function() {
    return gulp
        .src(
            [
                DIRS.out.css + '/**/*',
                DIRS.out.js + '/**/*',
                DIRS.out.img + '/**/*'
            ],
            { base: DIRS.out.root }
        )
        .pipe(rev())
        .pipe(revcssurls())
        .pipe(revdel())
        .pipe(gulp.dest(DIRS.out.root))
        .pipe(rev.manifest(FILES.assets))
        .pipe(gulp.dest(DIRS.out.manifest));
});

// run mocha tests
gulp.task('mocha', ['build'], function() {
    return gulp
        .src(testBase + '/features/**/*.js', {
            read: false
        })
        .pipe(
            mocha({
                reporter: 'spec',
                timeout: 20000,
                bail: true,
                exit: true
            })
        );
});

// run phantomjs
// @TODO if this task fails it doesn't stop the gulp task so the build passes!
gulp.task('phantomjs', ['test-scripts'], function() {
    return gulp.src(testBase + '/runner.html').pipe(
        mochaPhantomJS({
            mocha: {
                bail: true
            }
        })
    );
});

// run eslint
gulp.task('lint', function() {
    return gulp
        .src('**/*.js')
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
    gulp.watch(
        [DIRS.in.js + '/**/*.js', DIRS.in.test + '/**/*.js'],
        ['phantomjs']
    );
});

gulp.task('watch-mocha', function() {
    gulp.watch(DIRS.in.test + '/**/*.js', ['mocha']);
});
