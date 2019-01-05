const gulp = require("gulp");
const terser = require("gulp-terser");
const rename = require("gulp-rename");
const rollup = require("rollup-stream");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const sourcemaps = require("gulp-sourcemaps");
const watch = require("glob-watcher");

const BASE_NAME = "twenty-one-pips";
const SOURCE = "./src";
const DESTINATION = "./lib";
const inputFile = `${BASE_NAME}.js`;

const build = function () {
    return rollup({
        input: `${SOURCE}/${inputFile}`,
        format: "es",
        sourcemap: true
    })
    .pipe(source(inputFile, SOURCE))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(rename(`${BASE_NAME}.js`))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(DESTINATION))
    .pipe(terser())
    .pipe(rename(`${BASE_NAME}.min.js`))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(DESTINATION));
};

const watchToBuild = function (done) {
    build();
    done();
};

const watchTask = gulp.task("watch", () => watch([`${SOURCE}/**/*.js`], watchToBuild));

exports.default = build;
