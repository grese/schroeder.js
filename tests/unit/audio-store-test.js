
(function(){
    var expect = chai.expect;

    describe('Schroeder.AudioStore', function(){

        var mockInstruments, errorStub, mockAudioData;

        beforeEach(function(){
            mockAudioData = '0110101011010010110010100100010100100101010';
            mockInstruments = [
                {id: 'piano1', name: 'Piano One', _url: 'http://somewhere.com/piano1.mp3'},
                {id: 'piano2', name: 'Piano Two', _url: 'http://somewhere.com/piano2.mp3'},
                {id: 'obo', name: 'Obo', _url: 'http://somewhere.com/piano3.mp3'}
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
        });

        it('#findInstrumentById find an instrument by id from the instruments array, and undefined if no instrument found.', function(){
            var store;
            store = new Schroeder.AudioStore();
            store._instruments = mockInstruments;
            expect(store.findInstrumentById('piano1')).to.eq(mockInstruments[0]);
            expect(store.findInstrumentById('xylophone')).to.be.undefined;
        });

        it('#createInstrument should just log an error and execute the error callback if no ID is provided', function(){
            var store = new Schroeder.AudioStore();
            var cbSpy = sinon.spy();
            var errCbSpy = sinon.spy();
            store.createInstrument({}, cbSpy, errCbSpy);
            expect(errorStub.called).to.be.ok;
            expect(errCbSpy.calledOnce).to.be.ok;
            expect(cbSpy.called).not.to.be.ok;
        });

        it('#createInstrument should just log an error and execute the error callback if an instrument already exists with the id provided.', function(){
            var store = new Schroeder.AudioStore();
            var cbSpy = sinon.spy();
            var errCbSpy = sinon.spy();
            sinon.stub(store, 'findInstrumentById').returns(true);

            store.createInstrument({id: 'piano1'}, cbSpy, errCbSpy);
            expect(errorStub.called).to.be.ok;
            expect(errCbSpy.calledOnce).to.be.ok;
            expect(cbSpy.called).not.to.be.ok;
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

        it('#removeInstrument should remove a given instrument by id, and remove the cached decoded data from bufferCache', function(){
            var store = new Schroeder.AudioStore();
            var id = mockInstruments[2].id,
                url = mockInstruments[2]._url;
            store._instruments = mockInstruments;
            store._bufferCache.set(url, mockAudioData);
            store.removeInstrument(id);
            expect(store.findInstrumentById(id)).to.be.undefined;
            expect(store._bufferCache.has(url)).not.to.be.ok;
        });

        it('#_loadInstrument should just set the decoded audioData on the instrument if the url already exists in bufferCache, ' +
            'and should fire callback.', function(){
            var store = new Schroeder.AudioStore();
            var mockInstrument = mockInstruments[0];
            mockInstrument.setAudioData = sinon.spy();
            var callbackSpy = sinon.spy();
            var errCallbackSpy = sinon.spy();
            store._bufferCache.set(mockInstrument._url, mockAudioData);
            store._loadInstrument(mockInstrument, callbackSpy, errCallbackSpy);
            expect(mockInstrument.setAudioData.calledWith(mockAudioData)).to.be.ok;
            expect(callbackSpy.called).to.be.ok;
        });

        it('#_loadInstrument should make a GET request to load the raw audio file, ' +
            'and decode the raw audio data when the call succeeds.', function(){
            var store = new Schroeder.AudioStore();
            var mockInstrument = mockInstruments[0],
                callbackSpy = sinon.spy(),
                errCallbackSpy = sinon.spy(),
                decodeSpy = sinon.stub(store, '_decodeInstrument');

            store._loadInstrument(mockInstrument, callbackSpy, errCallbackSpy);
            var req = Schroeder.Test.ajax.mostRecent();
            req.response = mockAudioData;
            req.respond(200, {}, mockAudioData);
            expect(req.method).to.eq('GET');
            expect(req.url).to.eq(mockInstrument._url);
            expect(req.responseType).to.eq('arraybuffer');
            expect(decodeSpy.calledWith(mockInstrument, mockAudioData)).to.be.ok;
        });

        it('#_loadInstrument should make a GET request to load the raw audio file, ' +
            'and execute the error callback, and log an error if the call fails.', function(){
            var store = new Schroeder.AudioStore();
            var mockInstrument = mockInstruments[0],
                callbackSpy = sinon.spy(),
                errCallbackSpy = sinon.spy();

            store._loadInstrument(mockInstrument, callbackSpy, errCallbackSpy);
            var req = Schroeder.Test.ajax.mostRecent();
            expect(req.method).to.eq('GET');
            expect(req.url).to.eq(mockInstrument._url);
            expect(req.responseType).to.eq('arraybuffer');
            req.onerror();
            expect(errCallbackSpy.called).to.be.ok;
            expect(errorStub.called).to.be.ok;
        });

        it('#_decodeInstrument should decode the new audioData, update the decoded ' +
            'data on the instrument, and in the cache, and fire callback if decoding succeeds.', function(){
            var store = new Schroeder.AudioStore();
            var mockInstrument = mockInstruments[0];
            mockInstrument.setAudioData = sinon.spy();
            var decodedAudioData = 'xyz1jecwlrazjkleru49;akdjv4poqxculdafj';
            var stub = sinon.stub(store._ctx, 'decodeAudioData', function(data, cb, errCb){
                cb(decodedAudioData);
            });
            var callbackSpy = sinon.spy();
            store._decodeInstrument(mockInstrument, mockAudioData, callbackSpy, function(){});
            expect(store._bufferCache.get(mockInstrument._url)).to.eq(decodedAudioData);
            expect(mockInstrument.setAudioData.calledWith(decodedAudioData)).to.be.ok;
            expect(callbackSpy.called).to.be.ok;
            stub.restore();
        });

        it('#_decodeInstrument should log an error, and fire the error callback if decoding fails.', function(){
            var store = new Schroeder.AudioStore();
            var mockInstrument = mockInstruments[0];
            var stub = sinon.stub(store._ctx, 'decodeAudioData', function(data, cb, errCb){
                errCb();
            });
            var errCallbackSpy = sinon.spy();
            store._decodeInstrument(mockInstrument, mockAudioData, function(){}, errCallbackSpy);
            expect(errCallbackSpy.called).to.be.ok;
            expect(errorStub.called).to.be.ok;
            stub.restore();
        });

        it('#unlock should unlock the audio context by creating an empty buffer/bufferSource, connecting it to the destination, ' +
            'and playing the empty sound.', function(){
            var store = new Schroeder.AudioStore();
            var mockBufferSource = {
                buffer: null,
                connect: function(){},
                start: function(){}
            };
            var bufferSourceStub = sinon.stub(store._ctx, 'createBufferSource').returns(mockBufferSource);
            var connectSpy = sinon.spy(mockBufferSource, 'connect'),
                startSpy = sinon.spy(mockBufferSource, 'start');
            store.unlock();
            expect(mockBufferSource.buffer).not.to.be.null;
            expect(connectSpy.calledWith(store._ctx.destination)).to.be.ok;
            expect(startSpy.calledWith(0)).to.be.ok;
            bufferSourceStub.restore();
        });

    });

})();
