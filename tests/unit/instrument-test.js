
(function(){
    var expect = chai.expect;

    describe('Schroeder.Instrument', function(){

        var mockOptions,
            errorStub,
            mockAudioData;
        beforeEach(function(){
            mockAudioData = '0110101011010010110010100100010100100101010';
            mockOptions = {
                id: 'piano1',
                name: 'Piano One',
                urls: [
                    'http://something.com/somesound.mp3',
                    'http://something.com/somesound.m4a'
                ],
                sprite: {
                    c0: {
                        start: 105,
                        end: 112.45077097505668,
                        loop: false
                    },
                    d1: {
                        start: 114,
                        end: 121.46875283446713,
                        loop: false
                    },
                    fs2: {
                        start: 123,
                        end: 130.39061224489797,
                        loop: false
                    }
                },
                format: 'mp3',
                gain: 0.5,
                _ctx: Schroeder.Test.audioContext
            };
            errorStub = sinon.stub(console, 'error');
        });

        afterEach(function(){
            console.error.restore();
        });

        it('should initialize, be a Schroeder.Object, and have the correct defaults on init', function(){
            var instrument = Schroeder.Instrument.create();
            expect(instrument).to.be.an.instanceof(Schroeder.Object);
            expect(instrument.id).to.eq(null);
            expect(instrument.name).to.eq('');
            expect(instrument.urls).to.eql([]);
            expect(instrument.sprite).to.eq(null);
            expect(instrument.format).to.eq(null);
            expect(instrument.gain).to.eq(1);
            expect(instrument._ctx).to.eq(null);
            expect(instrument._url).to.eq(null);
            expect(instrument._audioData).to.eq(null);
            expect(instrument._audioNode).to.be.an.instanceof(Audio);
            expect(instrument._gainNode).not.to.be.ok;
        });

        it('should initialize, and assign supported options that are passed through constructor, ' +
            'and create the gain & audio nodes', function(){
            var instrument = Schroeder.Instrument.create(mockOptions);
            expect(instrument.id).to.eq(mockOptions.id);
            expect(instrument.name).to.eq(mockOptions.name);
            expect(instrument.urls).to.eql(mockOptions.urls);
            expect(instrument.sprite).to.eql(mockOptions.sprite);
            expect(instrument.format).to.eq(mockOptions.format);
            expect(instrument.gain).to.eq(mockOptions.gain);
            expect(instrument._ctx).to.eql(mockOptions._ctx);
            expect(instrument._url).to.eq(mockOptions.urls[0]);
            expect(instrument._audioData).to.eq(null);
            expect(instrument._audioNode).to.be.an.instanceof(Audio);
            expect(instrument._gainNode).to.be.ok;
        });

        it('#getUrlForFormat should return the appropriate URL for a given codec', function(){
            var instrument = Schroeder.Instrument.create(mockOptions);
            expect(instrument.getUrlForFormat('m4a')).to.eq(mockOptions.urls[1]);
        });

        it('#pickFirstSupportedFormat should loop through the urls array, and find the first URL that is supported by the browser, ' +
            'and set the url and format properties accordingly.', function(){
            var instrument = Schroeder.Instrument.create(mockOptions);
            var stub = sinon.stub(Schroeder.CODECS, 'isSupported').returns(true);
            instrument.pickFirstSupportedFormat();
            expect(instrument.format).to.eq('mp3');
            expect(instrument._url).to.eq('http://something.com/somesound.mp3');
            stub.restore();
        });

        it('#changeGain should update gain property, and the gain.value property on the gainNode.', function(){
            var instrument = Schroeder.Instrument.create(mockOptions);
            var gain = 0.75;
            instrument.changeGain(gain);
            expect(instrument.gain).to.eq(gain);
            expect(instrument._gainNode.gain.value).to.eq(gain);
        });

        it('#updateDuration should update the duration property to the duraiton of the audioNode, ' +
            'rounded to the nearest 10th.', function(){
            var instrument = Schroeder.Instrument.create(mockOptions);
            instrument._audioNode = {duration: 130.39061224489797};
            instrument.updateDuration();
            expect(instrument.duration).to.eq(130.4);
        });

        it('#createAudioNode should create a new Audio object, and set audioNode.src if the url is set', function(){
            var instrument = Schroeder.Instrument.create(mockOptions);
            var url = 'http://mock.com/somemock.mp3';
            instrument._url = url;
            instrument.createAudioNode();
            expect(instrument._audioNode).to.be.an.instanceof(Audio);
            expect(instrument._audioNode.src).to.eq(url);
        });

        it('#createGainNode should use the audioContext to create a new gainNode, and then call changeGain ' +
            'with the current gain value', function(){
            var instrument = Schroeder.Instrument.create(mockOptions);
            var gain = 0.4;
            instrument.gain = gain;
            var spy = sinon.spy(instrument, 'changeGain');
            instrument.createGainNode();
            expect(instrument._gainNode).to.be.ok;
            expect(spy.calledWith(gain)).to.be.ok;
        });

        it('#setAudioData should set the decoded audio data, update the duration, and create a default sprite if none exists.', function(){
            var instrument = Schroeder.Instrument.create();
            var updateDurationSpy = sinon.stub(instrument, 'updateDuration');
            var duration = 130.4;
            var sprite = {_default: {start: 0, end: duration}};
            instrument.duration = duration;

            instrument.setAudioData(mockAudioData);
            expect(updateDurationSpy.calledOnce).to.be.ok;
            expect(instrument.sprite).to.eql(sprite);
            expect(instrument._audioData).to.eq(mockAudioData);
        });

        it('#play should just log an error if the no sound exists for the given spritekey, or if audioData is not present. ' +
            'It should look for _default sprite item when no spritekey is provided.', function(){
            var instrument = Schroeder.Instrument.create(mockOptions);

            // audioData present, but sprite key doesn't exist...
            instrument._audioData = mockAudioData;
            instrument.play();

            // sprite item exists, but audioData not present...
            instrument.sprite._default = {};
            instrument._audioData = null;
            instrument.play();

            expect(errorStub.calledTwice).to.be.ok;
        });

        it('#play should play a particular sound by spriteKey, and apply options for nodes/filters to the sound.', function(){
            var mockBufferSource = {
                connect: function(){},
                start: function(){},
                stop: function(){},
                playbackRate: {},
                buffer: null
            };

            var instrument = Schroeder.Instrument.create(mockOptions);
            var gainConnectSpy = sinon.stub(instrument._gainNode, 'connect');
            var sourceConnectSpy = sinon.spy(mockBufferSource, 'connect');
            var sourceStartSpy = sinon.spy(mockBufferSource, 'start');
            var sourceStopSpy = sinon.spy(mockBufferSource, 'stop');
            var bufferSourceStub = sinon.stub(instrument._ctx, 'createBufferSource').returns(mockBufferSource);
            var duration = mockOptions.sprite.c0.end - mockOptions.sprite.c0.start,
                durationMs = duration * 1000;
            instrument._audioData = mockAudioData;

            Schroeder.Test.async.throttle(sourceStopSpy, durationMs)();
            Schroeder.Test.async.clock.tick(1);
            instrument.play('c0', {playbackRate: 2});

            // Creates a bufferSource on audioContext...
            expect(bufferSourceStub.called).to.be.ok;

            // Sets playbackRate option on the sourceNode...
            expect(mockBufferSource.playbackRate.value).to.eq(2);

            // Sets audioData on sourceNode...
            expect(mockBufferSource.buffer).to.eq(mockAudioData);

            // should connect sourceNode to gainNode, and gainNode to destination...
            expect(sourceConnectSpy.calledWith(instrument._gainNode)).to.be.ok;
            expect(gainConnectSpy.calledWith(instrument._ctx.destination)).to.be.ok;

            // should start to play note with source.start...
            expect(sourceStartSpy.calledWith(0, mockOptions.sprite.c0.start), duration).to.be.ok;

            // should call source.stop after duration * 1000 ms
            Schroeder.Test.async.clock.tick(durationMs);
            expect(sourceStopSpy.called).to.be.ok;
            bufferSourceStub.restore();
        });

    });
})();
