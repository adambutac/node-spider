import gulp from 'gulp';
import babel from 'gulp-babel';
import uglify from 'gulp-uglify';
import rename from 'gulp-rename';
import del from 'del';

const paths = {
  scripts: {
    src: 'src/**/*.js',
    dest: 'build/'
  }
};

/*
 * For small tasks you can export arrow functions
 */
export const clean = () => del([ 'assets' ]);

export function scripts() {
  return gulp.src(paths.scripts.src, { sourcemaps: true })
    .pipe(babel())
    .pipe(uglify())
    .pipe(gulp.dest(paths.scripts.dest));
}

 /*
  * You could even use `export as` to rename exported tasks
  */
function watchFiles() {
  gulp.watch(paths.scripts.src, scripts);
}
export { watchFiles as watch };

/*
 * You can still use `gulp.task`
 * for example to set task names that would otherwise be invalid
 */
const build = gulp.series(clean, gulp.parallel(scripts));
gulp.task('build', build);

/*
 * Export a default task
 */
export default build;