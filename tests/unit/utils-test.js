
(function(){
    var expect = chai.expect;

    describe('Schroeder Utils', function(){

        it('should assign a CODECS object to Schroeder.', function(){
            expect(Schroeder.CODECS).to.be.an.instanceof(Object);
        });

        it('should also expose a CODECS.isSupported function, and should return true for mp3 ' +
            '(provided that phantom is not running tests.)', function(){
            var supported = !isPhantom && Schroeder.CODECS.isSupported('mp3');
            var isPhantom = /PhantomJS/.test(window.navigator.userAgent);
            expect(Schroeder.CODECS.isSupported).to.be.an.instanceof(Function);
            expect(supported).to.be.ok;
        });

    });
})();
