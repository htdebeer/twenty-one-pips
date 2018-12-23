const gulp = require("gulp");
const uglifyEs = require("gulp-uglify-es").default;
const rename = require("gulp-rename");
const rollup = require("gulp-rollup");
const sourcemaps = require("gulp-sourcemaps");

const BASE_NAME = "twenty-one-pips";
const SOURCE = "./src";
const DESTINATION = "./lib";

const defaultTask = function () {
    return gulp.src(`${SOURCE}/**/*.js`)
        .pipe(sourcemaps.init())
            .pipe(rollup({
                input: `${SOURCE}/${BASE_NAME}.js`,
                output: {
                    format: "es",
                }
            }))
            .pipe(rename(`${BASE_NAME}.js`))
            .pipe(sourcemaps.write())
        .pipe(gulp.dest(DESTINATION))
            .pipe(uglifyEs())
            .pipe(rename(`${BASE_NAME}.min.js`))
            .pipe(sourcemaps.write("."))
        .pipe(gulp.dest(DESTINATION));
};

exports.default = defaultTask;
