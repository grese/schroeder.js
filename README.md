# schroeder.js
A library built on top of the WebAudio API.

## Production
To use the finished product in production, simply add the following script tag in the DOM:
`<script src='dist/schroeder.js'></script>`

## Development:

### Install:
Just a few things to do first:
* `git clone https://github.com/grese/schroeder.js.git`
* `cd schroeder.js`
* `npm install -g bower` (skip if bower is already installed globally)
* `npm install -g testem` (skip if testem is already installed globally)
* `npm install`

### Tests
The project uses [Mocha](http://mochajs.org/) as the testing framework, [Chai](http://chaijs.com/) for assertions, and [Sinon](http://sinonjs.org/) for spies & stubs.  The test runner is testem (which you would have installed during the installation steps).
* `npm test`

### Dist:
To update the production version of this file (dist), this is the command:
* `node build dist`
