import gulp from "gulp";
import path from "path";
import exists from "path-exists";
import paths from "vinyl-paths";
import del from "del";
import run from "run-sequence";
import jasmine from "gulp-jasmine";
import reporters from "jasmine-reporters";
import typescript from "typescript";
import gts from "gulp-typescript";
import sass from "gulp-sass";
import merge from "merge2";
import tsconfig from "./tsconfig.json";
import pkconfig from "./package.json";
import child from "child_process";

const dependencies = Object.keys(pkconfig.dependencies).filter(dep => exists.sync("../" + dep));
const sassOptions = {
    importer: url => ({ file: url.startsWith("~") ? path.resolve("node_modules", url.substr(1)) : url })
};
const tsc = gts(Object.assign({ typescript: typescript }, tsconfig.compilerOptions));
const typescriptSources = [ tsconfig.compilerOptions.rootDir + "/**/*.ts" ];
const htmlSources = [ tsconfig.compilerOptions.rootDir + "/**/*.html" ];
const scssSources = [ tsconfig.compilerOptions.rootDir + "/**/*.scss" ];
const output = tsconfig.compilerOptions.outDir;
const testSuites = [ "test/**/*.js" ];
const clean = [ output ];

gulp.task("clean", done => gulp.src(clean).pipe(paths(del)));
gulp.task("build-typescript", done => {
    let stream = gulp.src(typescriptSources).pipe(tsc);
    return merge([
        stream.js.pipe(gulp.dest(output)),
        stream.dts.pipe(gulp.dest(output))
    ]);
});
gulp.task("build-scss", done => gulp.src(scssSources).pipe(sass(sassOptions)).pipe(gulp.dest(output)));
gulp.task("build-html", done => gulp.src(htmlSources).pipe(gulp.dest(output)));
gulp.task("build", done => run("clean", [ "build-typescript", "build-scss", "build-html" ], done));

dependencies.forEach(dependency => {
    const dependencyPath = "../" + dependency;
    const dependencyDist = dependencyPath + "/dist/**/*";
    const dependencyModule = "node_modules/" + dependency + "/dist";
    gulp.task("spawn-" + dependency, done => {
        const spawnLock = "../.spawn-" + dependency;
        exists.sync(spawnLock) || child.spawn("gulp", [ "watch" ], { cwd: dependencyPath });
        child.spawn("touch", [ spawnLock ]);
        return done();
    });
    gulp.task("sync-" + dependency, done => gulp.src(dependencyDist).pipe(gulp.dest(dependencyModule)));
    gulp.task("watch-" + dependency, [ "spawn-" + dependency ], done => gulp.watch(dependencyDist, ["sync-" + dependency]));
});

gulp.task("watch-dependencies", dependencies.map(dependency => "watch-" + dependency));
gulp.task("watch-typescript", done => gulp.watch(typescriptSources, [ "build-typescript" ]));
gulp.task("watch-scss", done => gulp.watch(scssSources, [ "build-scss" ]));
gulp.task("watch-html", done => gulp.watch(htmlSources, [ "build-html" ]));
gulp.task("watch", [ "watch-dependencies", "watch-typescript", "watch-scss", "watch-html" ]);
gulp.task("test", [ "build" ], done => gulp.src(testSuites).pipe(jasmine()));
gulp.task("default", () => run("build", "test"));
