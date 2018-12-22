const gulp = require("gulp");
//const babel = require("rollup-plugin-babel");
const babel = require("gulp-babel");
const sourcemaps = require("gulp-sourcemaps");
const rollup = require("gulp-rollup");
const rename = require("gulp-rename");

const defaultTask = function () {
    return gulp.src("./src/**/*.js")
        .pipe(sourcemaps.init({
        }))
        .pipe(rollup({
            input: "./src/twenty-one-pips.js",
            output: {
                format: "es",
            }
        }))
        .pipe(rename("twenty-one-pips.es.js"))
        .pipe(gulp.dest("./dist"))
        .pipe(babel({
            presets: [
                "@babel/preset-env"
            ]
        }))
        .pipe(rename("twenty-one-pips.js"))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("./dist"));
};

exports.default = defaultTask;
