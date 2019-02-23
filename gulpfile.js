const gulp = require('gulp');
const webpack = require('webpack-stream');
const download = require('gulp-download2');
const decompress = require('gulp-decompress');
const filter = require('gulp-filter');
const rename = require('gulp-rename');
const fs = require('fs');

var webpackConfig = require('./webpack.config.js');

var s3 = require('gulp-s3-upload')(
  {useIAM:true},
  { /* S3 Config */ }
);

//webpackConfig.mode = 'production';

gulp.task('webpack', function() {
  return gulp.src('src/index.js')
    .pipe(webpack( webpackConfig ))
    .pipe(gulp.dest('dist/v1'));
});

// download('http://mirrors.ctan.org/fonts/cm/ps-type1/bakoma.zip')

gulp.task('fonts', 
          function() {
            return gulp.src('bakoma.zip')
              .pipe(decompress())
              .pipe(filter(['**/*.ttf']))
              .pipe(gulp.dest("dist"));
          });

var crypto = require('crypto');

function sha1(filename) {
  var shasum = crypto.createHash('sha1');
  var s = fs.ReadStream(filename);
  var hash = filename;

  return new Promise( function(resolve, reject) {
    s.on('data', function(data) {
      shasum.update(data);
    });

    s.on('error', function(e) {
      reject(e);
    });
    
    s.on('end', function() {
      hash = shasum.digest('hex');
      resolve(hash);
    });
  });
}

gulp.task('copy-core', async function() {
  let coredump = await sha1('core.dump.gz');

  return gulp.src('core.dump.gz')
    .pipe(rename(`${coredump}.gz` ))
    .pipe(gulp.dest('dist'));
});

gulp.task('copy-wasm', async function() {
  let wasm = await sha1('tex.wasm');

  return gulp.src('tex.wasm')
    .pipe(rename(`${wasm}.wasm` ))
    .pipe(gulp.dest('dist'));
});

gulp.task('copy-css', function() {
  return gulp.src('fonts.css')
    .pipe(gulp.dest('dist/v1'));
});

gulp.task("upload", function() {
  return gulp.src("./dist/**")
    .pipe(s3({
      Bucket: 'tikzjax.com',
      ACL:    'public-read'
    }, {
      maxRetries: 5
    }));
});

gulp.task('default', defaultTask);
function defaultTask(done) {
  // place code for your default task here
  done();
}
