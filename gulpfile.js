'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const foutWithAClass = require('postcss-fout-with-a-class').default;
const cssnano = require('cssnano');
const sourcemaps = require('gulp-sourcemaps');
const fs = require('fs');

const { getBuildSummary } = require('./build-helpers');

const buildSummary = getBuildSummary();

gulp.task('css', function() {
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
