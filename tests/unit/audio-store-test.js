
(function(){
    var expect = chai.expect;

    describe('Schroeder.AudioStore', function(){

        var mockInstruments;
        beforeEach(function(){
            mockInstruments = [
                {id: 'piano1', name: 'Piano One'},
                {id: 'piano2', name: 'Piano Two'},
                {id: 'obo', name: 'Obo'}
            ];
        });

        it('should exist, and be an object', function(){
            expect(Schroeder.AudioStore).to.be.an.instanceof(Object);
        });

        it('should initialize, create an AudioContext and BufferCache on initialization, assign default properties, ' +
            'and assign options passed in through constructor.', function(){
            var store;
            store = new Schroeder.AudioStore({
                format: 'mp3'
            });
            expect(store._bufferCache).to.be.an.instanceof(Object);
            expect(store._ctx).to.be.an.instanceof(AudioContext);
            expect(store._instruments).to.eql([]);
            expect(store._format).to.eq('mp3');


            store = new Schroeder.AudioStore();
            expect(store._format).to.eq('auto');
        });

        it('#findInstrumentById find an instrument by id from the instruments array, and undefined if no instrument found.', function(){
            var store;
            store = new Schroeder.AudioStore();
            store._instruments = mockInstruments;
            expect(store.findInstrumentById('piano1')).to.eq(mockInstruments[0]);
            expect(store.findInstrumentById('xylophone')).to.be.undefined;
        });

        it('#createInstrument should just log an error if no ID is provided', function(){
            var store = new Schroeder.AudioStore();
            var spy = sinon.spy(console, 'error');

            store.createInstrument();
            expect(spy.called).to.be.ok;
            console.error.restore();
        });

        it('#createInstrument should just log an error if an instrument already exists with the id provided.', function(){
            var store = new Schroeder.AudioStore();
            sinon.stub(store, 'findInstrumentById').returns(true);

            var spy = sinon.spy(console, 'error');
            store.createInstrument({id: 'piano1'});
            expect(spy.called).to.be.ok;
        });

        it('#createInstrument should add a new Schroeder.Instrument with provided options, load the instrument, add it to the instruments array.', function(){
            var store = new Schroeder.AudioStore();
            var spy = sinon.stub(store, '_loadInstrument');

            store.createInstrument({ id: 'piano1' });
            expect(spy.called).to.be.ok;
            expect(store._instruments.length).to.eq(1);
            expect(store._instruments[0]).to.be.an.instanceof(Schroeder.Instrument);
            expect(store._instruments[0].id).to.eq('piano1');
        });

    });

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
