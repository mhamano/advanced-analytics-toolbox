var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean-css');
var autoprefixer = require("gulp-autoprefixer");
var imagemin = require('gulp-imagemin');
var less = require('gulp-less');
var babel = require('gulp-babel');
var del = require('del');
var zip = require('gulp-zip');
var plumber = require("gulp-plumber");
var rimraf = require('rimraf');
var htmlmin = require('gulp-htmlmin');
var sourcemaps = require('gulp-sourcemaps');
var config = require('./package.json');

gulp.task('clean', function(cb) {
  rimraf('./build/dev/*', cb);
  console.log('Clean build dir task completed');
});

gulp.task('js:root', function() {
  gulp.src('./src/*.js')
  .pipe(plumber())
  .pipe(sourcemaps.init())
  .pipe(babel())
  .pipe(uglify())
  .pipe(sourcemaps.write('./lib/maps/'))
  .pipe(gulp.dest('./build/dev/'));
});

gulp.task('js:lib', function() {
  gulp.src('./src/lib/js/*.js')
  .pipe(plumber())
  .pipe(sourcemaps.init())
  .pipe(babel())
  .pipe(uglify())
  .pipe(sourcemaps.write('../../lib/maps/'))
  .pipe(gulp.dest('./build/dev/lib/js/'));
});

gulp.task('js:lib:subdir', function() {
  gulp.src('./src/lib/js/*/*.js')
  .pipe(plumber())
  .pipe(sourcemaps.init())
  .pipe(babel())
  .pipe(uglify())
  .pipe(sourcemaps.write('../../lib/maps/'))
  .pipe(gulp.dest('./build/dev/lib/js/'));
});

gulp.task('js:vendor', function() {
  gulp.src('./src/lib/vendor/**/*.js')
  .pipe(plumber())
  //.pipe(sourcemaps.init())
  //.pipe(babel())
  //.pipe(uglify())
  //.pipe(sourcemaps.write('../../lib/maps/'))
  .pipe(gulp.dest('./build/dev/lib/vendor/'));
});

gulp.task('css', function() {
  gulp.src('./src/lib/css/*.css')
  .pipe(plumber())
  .pipe(sourcemaps.init())
  .pipe(autoprefixer())
  .pipe(clean())
  .pipe(sourcemaps.write('../../lib/maps/'))
  .pipe(gulp.dest('./build/dev/lib/css/'));
});

gulp.task('css:vendor', function() {
  gulp.src('./src/lib/vendor/**/*.css')
  .pipe(plumber())
  .pipe(sourcemaps.init())
  .pipe(autoprefixer())
  .pipe(clean())
  .pipe(sourcemaps.write('../../lib/maps/'))
  .pipe(gulp.dest('./build/dev/lib/vendor/'));
});

gulp.task('less', function() {
  gulp.src('./src/lib/less/_root.less')
  .pipe(plumber())
  .pipe(sourcemaps.init())
  .pipe(concat('styles.css'))
  .pipe(less())
  .pipe(autoprefixer())
  .pipe(clean())
  .pipe(sourcemaps.write('../../lib/maps/'))
  .pipe(gulp.dest('./build/dev/lib/css/'));
});

gulp.task('html', function() {
  gulp.src('./src/*.html')
  .pipe(htmlmin({collapseWhitespace: true}))
  .pipe(gulp.dest('./build/dev/'));
});

gulp.task('element:html', function() {
  gulp.src('./src/lib/js/ui/element/*.html')
  //.pipe(htmlmin({collapseWhitespace: true}))
  .pipe(gulp.dest('./build/dev/lib/js/ui/element/'));
});

gulp.task('images:root', function() {
  gulp.src('./src/*.+(jpg|jpeg|png|gif|svg)')
  .pipe(imagemin())
  .pipe(gulp.dest('./build/dev/'));
});

gulp.task('images:lib', function() {
  gulp.src('./src/lib/images/*.+(jpg|jpeg|png|gif|svg)')
  .pipe(imagemin())
  .pipe(gulp.dest('./build/dev/lib/images/'));
});

gulp.task('images:vendor', function() {
  gulp.src('./src/lib/vendor/images/*.+(jpg|jpeg|png|gif|svg)')
  .pipe(imagemin())
  .pipe(gulp.dest('./build/dev/lib/vendor/images/'));
});

gulp.task('qext', function() {
  gulp.src('./src/*.qext')
  .pipe(plumber())
  .pipe(gulp.dest('./build/dev/'));
});

gulp.task('release', function() {
  gulp.src([
    './build/dev/*',
    './build/dev/lib/css/*',
    './build/dev/lib/images/*',
    './build/dev/lib/css/*',
    './build/dev/lib/images/*',
    './build/dev/lib/js/analysis/*',
    './build/dev/lib/js/chart/*',
    './build/dev/lib/js/ui/*',
    './build/dev/lib/js/ui/element/*',
    './build/dev/lib/js/util/*',
    './build/dev/lib/vendor/*',
    './build/dev/lib/vendor/*/*',
  ], {base: './build/dev'})
  .pipe(zip( config.main + '-' + config.version + '.zip'))
  .pipe(gulp.dest('./build/release/'))
});

gulp.task('default',  ['js:root', 'js:lib', 'js:lib:subdir', 'js:vendor', 'css', 'css:vendor', 'less', 'html', 'element:html', 'images:root', 'images:lib', 'images:vendor', 'qext'], function() {
  console.log("Default task completed.");
});

gulp.task('watch', function() {
  gulp.watch('./src/*.js', ['js:root']);
  gulp.watch('./src/lib/js/*.js', ['js:lib']);
  gulp.watch('./src/lib/js/*/*.js', ['js:lib:subdir']);
  gulp.watch('./src/lib/vendor/*.js', ['js:vendor']);
  gulp.watch('./src/lib/css/*.css', ['css']);
  gulp.watch('./src/lib/vendor/*.css', ['css:vendor']);
  gulp.watch('./src/lib/less/*.less', ['less']);
  gulp.watch('./src/*.html', ['html']);
  gulp.watch('./src/lib/js/ui/element/*.html', ['element:html']);
  gulp.watch('./src/*.+(jpg|jpeg|png|gif|svg)', ['images:root']);
  gulp.watch('./src/lib/images/*.+(jpg|jpeg|png|gif|svg)', ['images:lib']);
  gulp.watch('./src/lib/vendor/images/*.+(jpg|jpeg|png|gif|svg)', ['images:vendor']);
  gulp.watch('./src/*.qext', ['qext']);
});
