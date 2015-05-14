
(function(){
    var expect = chai.expect;

    describe('Schroeder.BufferCache', function(){

        var mockInstruments;
        beforeEach(function(){
            mockInstruments = [
                {id: 'piano1', name: 'Piano One'},
                {id: 'piano2', name: 'Piano Two'}
            ];
        });

        it('should exist, and be an object', function(){
            expect(new Schroeder.BufferCache()).to.be.an.instanceof(Object);
        });

        it('#get, should return the value for a given key, or undefined otherwise', function(){
            var cache = new Schroeder.BufferCache();
            var key1 = 'http://something.com/somefile.mp3';
            cache.set(key1, mockInstruments[0]);

            expect(cache.get(key1)).to.eq(mockInstruments[0]);
            expect(cache.get('someotherkey')).to.be.undefined;
        });

        it('#set should set the value for a given key.', function(){
            var cache = new Schroeder.BufferCache();
            var key1 = 'http://something.com/somefile.mp3';
            cache.set(key1, mockInstruments[0]);
            expect(cache.get(key1)).to.eq(mockInstruments[0]);

            cache.set(key1, mockInstruments[1]);
            expect(cache.get(key1)).to.eq(mockInstruments[1]);
        });

        it('#remove should delete an item from the cache by key.', function(){
            var cache = new Schroeder.BufferCache();
            var key1 = 'http://something.com/somefile.mp3';
            cache.set(key1, mockInstruments[0]);
            cache.remove(key1);
            expect(cache.get(key1)).to.be.undefined;
        });

        it('#clear should remove all items from the cache', function(){
            var cache = new Schroeder.BufferCache();
            var key1 = 'http://something.com/somefile.mp3';
            cache.set(key1, mockInstruments[0]);

            cache.clear();
            expect(cache.get(key1)).to.be.undefined;
            expect(cache.size()).to.eq(0);
        });

        it('#size should return the number of keys currently in the cache', function(){
            var cache = new Schroeder.BufferCache();
            expect(cache.size()).to.eq(0);

            cache.set('http://something.com/somefile.mp3', mockInstruments[0]);
            expect(cache.size()).to.eq(1);

            cache.set('http://something.com/otherfile.mp3', mockInstruments[1]);
            expect(cache.size()).to.eq(2);

            cache.set('http://somewhere.com/obo.mp3', mockInstruments[2]);
            expect(cache.size()).to.eq(3);

            cache.clear();
            expect(cache.size()).to.eq(0);
        });

        it('#has should return true if the given key exists, false otherwise', function(){
            var cache = new Schroeder.BufferCache();
            expect(cache.has('key1')).to.eq(false);

            cache.set('key1', mockInstruments[0]);
            expect(cache.has('key1')).to.eq(true);
        });

    });
})();
