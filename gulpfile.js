const browserify = require('browserify');
const { series, dest } = require('gulp');
const log = require('gulplog');
const plumber = require('gulp-plumber');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const fs = require("fs");

function compile(done) {
    return browserify({
            entries: [
                './http/kaspa-wallet-worker.js'  // THIS LINE HAS CHANGED FROM THE QUESTION
            ],
            //'sourceType':'module',
            standalone: '__MODULE__',
            //exclude:['web-worker'],
            debug: false
        })
        .transform('babelify', {
            presets: ["@babel/preset-env"], 
            sourceMaps: true, 
            //global: true, 
           // ignore: [/\/node_modules\/(?!your module folder\/)/]
        })
        .bundle()
            //.on('error', log.error)
        .pipe(source('kaspa-wallet-worker-temp.js'))
        .pipe(plumber())
        .pipe(dest('./dist'));
}

let buildES6 = async()=>{
    global.Worker = {};
    let mod = require("./dist/kaspa-wallet-worker-temp.js");
    console.log("mod", mod)
    let keys = Object.keys(mod);
    
    let c = (fs.readFileSync('./dist/kaspa-wallet-worker-temp.js')+"")
    c = "let __MODULE__;\n"+c.replace('g.__MODULE__', '__MODULE__');
    c += `\nexport const {${keys.join(',')}} = __MODULE__\n`;
    fs.writeFileSync('./dist/kaspa-wallet-worker.js', c);
}

module.exports = {
    build: series(compile, buildES6)
};