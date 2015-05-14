
(function(){
    var expect = chai.expect;

    describe('Schroeder.AudioStore', function(){

        var mockInstruments, errorStub;

        beforeEach(function(){
            mockInstruments = [
                {id: 'piano1', name: 'Piano One'},
                {id: 'piano2', name: 'Piano Two'},
                {id: 'obo', name: 'Obo'}
            ];
            errorStub = sinon.stub(console, 'error');
        });

        afterEach(function(){
            console.error.restore();
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
            store.createInstrument();
            expect(errorStub.called).to.be.ok;

        });

        it('#createInstrument should just log an error if an instrument already exists with the id provided.', function(){
            var store = new Schroeder.AudioStore();
            sinon.stub(store, 'findInstrumentById').returns(true);

            store.createInstrument({id: 'piano1'});
            expect(errorStub.called).to.be.ok;
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

})();
