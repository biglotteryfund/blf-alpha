'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const foutWithAClass = require('postcss-fout-with-a-class').default;
const cssnano = require('cssnano');
const sourcemaps = require('gulp-sourcemaps');

gulp.task('css', function() {
    return gulp
        .src('assets/sass/*.scss')
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
        .pipe(gulp.dest('public/build/latest/stylesheets'));
});
