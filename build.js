var concat = require('concat-files');
var fs = require('fs');

var outputFile = './schroeder.js';
var inputFiles = [
	'src/schroeder.js',
	'src/utils.js',
	'src/instrument.js',
	'src/audio-ctx.js'
];

var tmpDir = './tmp/';
if (!fs.existsSync(tmpDir)){
    fs.mkdirSync(tmpDir);
}
var tmpOutputFile = tmpDir + 'tmp.schroeder.js';
var testOutputFile = tmpDir + 'test.schroeder.js';
concat(inputFiles, tmpOutputFile, function() {
	// copy file to the test file...
	var tmpFileContents = fs.readFileSync(tmpOutputFile).toString();
	var jsToAppend = "\nvar Schroeder;\nvar Audio;\nmodule.exports = Schroeder;";
	var testFileContents = tmpFileContents + jsToAppend;
	fs.writeFileSync(testOutputFile, testFileContents);

	// Write the actual dist file too...
	fs.writeFileSync(outputFile, tmpFileContents);	
});

