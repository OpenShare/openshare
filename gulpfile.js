var gulp = require('gulp'),
    browserify = require('browserify'),
    babel = require('gulp-babel'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    uglify = require('gulp-uglify');

gulp.task('default', function() {
    return browserify('src/index.js')
            .bundle()
            .pipe(source('open-share.js'))
            .pipe(buffer())
            .pipe(babel())
            .pipe(uglify())
            .pipe(gulp.dest('dist'));
});
