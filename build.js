/*
    A simple build script to build project, tests, and dist files.
*/

var concat = require('concat-files');
var fs = require('fs');

var args = process.argv || [];
var doDist = (args[2] === 'dist');


var schroederFiles = [
	'src/schroeder.js',
    'src/object.js',
	'src/utils.js',
	'src/instrument.js',
	'src/audio-store.js'
];
var testFiles = [
    'tests/test-helpers.js',
    'tests/unit/schroeder-test.js',
    'tests/unit/object-test.js',
    'tests/unit/utils-test.js',
    'tests/unit/audio-store-test.js',
    'tests/unit/instrument-test.js'
];

var tmpDir = './tmp/';
if (!fs.existsSync(tmpDir)){
    fs.mkdirSync(tmpDir);
}
var distDir = './dist/';
if (!fs.existsSync(distDir)){
    fs.mkdirSync(distDir);
}
var tmpOutput = tmpDir + 'tmp.schroeder.js';
var testsOutput = tmpDir + 'tests.schroeder.js';
var distOutput = distDir + 'schroeder.js';


concatFiles(schroederFiles, tmpOutput, function(){
    concatFiles(testFiles, testsOutput, function(){
        if(doDist){
            console.log('generating dist...');
            copyFileSync(tmpOutput, distOutput);
        }
    });
});



function concatFiles(inputFiles, outputFile, done){
    concat(inputFiles, outputFile, done);
}
function copyFileSync(inputFile, outputFile){
    var contents = fs.readFileSync(inputFile).toString();
    return fs.writeFileSync(outputFile, contents);
}
