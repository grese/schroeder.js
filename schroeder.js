export default
(function(){
    // verify support for WebAudio API...
    var ctx = null;
    var bufferCache = {};

    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioContext();
    }catch(e) {
        console.error('Web Audio API is not supported in this browser', e);
    }

    var CodecTester = function(){
        var audio;
        try{
            audio = new Audio();
        }catch(e){
            console.error('Audio object is not supported in this browser.', e);
        }
        var codecList = {
            mp3: !!audio.canPlayType('audio/mpeg;').replace(/^no$/, ''),
            opus: !!audio.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ''),
            ogg: !!audio.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
            wav: !!audio.canPlayType('audio/wav; codecs="1"').replace(/^no$/, ''),
            aac: !!audio.canPlayType('audio/aac;').replace(/^no$/, ''),
            m4a: !!(audio.canPlayType('audio/x-m4a;') || audio.canPlayType('audio/m4a;') || audio.canPlayType('audio/aac;')).replace(/^no$/, ''),
            mp4: !!(audio.canPlayType('audio/x-mp4;') || audio.canPlayType('audio/mp4;') || audio.canPlayType('audio/aac;')).replace(/^no$/, ''),
            weba: !!audio.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, '')
        };
        this.isSupported = function(key){
            return (codecList[key] !== undefined) ? codecList[key] : false;
        };
    };
    var CODECS = new CodecTester(),
        FILTER_TYPES = [
            "lowpass",
            "highpass",
            "bandpass",
            "lowshelf",
            "highshelf",
            "peaking",
            "notch",
            "allpass"
        ];

    var BiQuadFilter = function(type, options){
        options = options || {};
        this.type = type;
        this.setOptions(options);
    };
    BiQuadFilter.prototype.setOptions = function(options){
        switch(this.type){
            case 'lowpass':
            case 'highpass':
            case 'bandpass':
            case 'notch':
            case 'allpass':
                this.frequency = options.frequency;
                this.q = options.q;
                break;
            case 'lowshelf':
            case 'highshelf':
                this.frequency = options.frequency;
                this.gain = options.gain;
                break;
            case 'peaking':
                this.frequency = options.frequency;
                this.q = options.q;
                this.gain = options.gain;
                break;
            default:
                console.error('Unsupported filter type. Current supported filter types are: ' + FILTER_TYPES.join(', '));
                return;
        }
    };

    var SIMPLE_REVERB_DEFAULT = {
        name: "SimpleReverb",
        seconds: {
            min: 1,
            max: 50,
            defaultValue: 3,
            type: "float"
        },
        decay: {
            min: 0,
            max: 100,
            defaultValue: 2,
            type: "float"
        },
        reverse: {
            min: 0,
            max: 1,
            defaultValue: 0,
            type: "bool"
        }
    };
    /*
     * Simple Reverb constructor.
     *
     * @param {AudioContext} context
     * @param {object} opts
     * @param {number} opts.seconds
     * @param {number} opts.decay
     * @param {boolean} opts.reverse
     */
    function SimpleReverb (context, opts) {
        this.input = this.output = context.createConvolver();
        this._context = context;

        var p = SIMPLE_REVERB_DEFAULT;
        opts = opts || {};
        this._seconds   = opts.seconds  || p.seconds.defaultValue;
        this._decay     = opts.decay    || p.decay.defaultValue;
        this._reverse   = opts.reverse  || p.reverse.defaultValue;
        this._buildImpulse();
    }

    SimpleReverb.prototype = Object.create(null, {
        //AudioNode prototype `connect` method.
        //@param {AudioNode} dest
        connect: {
            value: function (dest) {
                this.output.connect( dest.input ? dest.input : dest );
            }
        },
        //AudioNode prototype `disconnect` method.
        disconnect: {
            value: function () {
                this.output.disconnect();
            }
        },
        //Utility function for building an impulse response from the module parameters.
        _buildImpulse: {
            value: function () {
                var rate = this._context.sampleRate,
                    length = rate * this.seconds,
                    decay = this.decay,
                    impulse = this._context.createBuffer(2, length, rate),
                    impulseL = impulse.getChannelData(0),
                    impulseR = impulse.getChannelData(1),
                    n, i;

                for (i = 0; i < length; i++) {
                    n = this.reverse ? length - i : i;
                    impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
                    impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
                }

                this.input.buffer = impulse;
            }
        },
        //Module parameter metadata.
        seconds: {
            enumerable: true,
            get: function () { return this._seconds; },
            set: function (value) {
                this._seconds = value;
                this._buildImpulse();
            }
        },
        decay: {
            enumerable: true,
            get: function () { return this._decay; },
            set: function (value) {
                this._decay = value;
                this._buildImpulse();
            }
        },
        reverse: {
            enumerable: true,
            get: function () { return this._reverse; },
            set: function (value) {
                this._reverse = value;
                this._buildImpulse();
            }
        }

    });

    /*
     Instrument -
     Sample Options:
     {
     name: 'piano',
     format: 'mp3', // if not specified, first supported format will be chosen
     urls: [
     '/audio/piano/output.mp3',
     '/audio/piano/output.m4a',
     '/audio/piano/output.ogg'
     ],
     sprite: {
     c: {start: 302, end: 304.54403628117916},
     d: {start: 306, end: 308.5150113378685}
     },
     _ctx: AudioContext
     }
     */
    var Instrument = function(options){
        options = options || {};
        this.name = options.name || null;
        this.urls = options.urls || [];
        this.sprite = options.sprite;
        this.format = options.format;
        this.gain = (options.gain !== undefined) ? options.gain : 1;
        this.filters = [];
        this._ctx = options.ctx;
        this._audioNode = new Audio();
        this._gainNode = null;
    };
    Instrument.prototype.getUrlForCodec = function(codec){
        var ext, url;
        for(var i=0; i<this.urls.length; i++){
            url = this.urls[i];
            ext = url.substring(url.lastIndexOf('.') + 1);
            if(codec === ext){
                return url;
            }else if(CODECS.isSupported(ext)){
                return url;
            }
        }
    };
    Instrument.prototype.changeGain = function(value){
        this.gain = value;
        this._gainNode.gain.value = this.gain;
    };
    Instrument.prototype.load = function(cb, errCb){
        this._url = this.getUrlForCodec(this.format);
        if(!this._url){
            console.error('Could not find valid format ' + this.name + '.');
            return;
        }

        var instr = this;
        if(!bufferCache[this._url]){
            this._audioNode.src = this._url;
            var req = new XMLHttpRequest();
            req.open('GET', this._url, true);
            req.responseType = 'arraybuffer';
            req.onload = function() {
                // Decode asynchronously
                instr.decode(req.response, cb, errCb);
            };
            req.onerror = function(){
                if(errCb instanceof Function) { errCb(); }
            };
            req.send();
        }
    };
    Instrument.prototype.decode = function(arraybuffer, cb, errCb){
        var instr = this;
        this._ctx.decodeAudioData(arraybuffer, function(buffer) {
            instr.duration = Math.ceil(instr._audioNode.duration * 10) / 10;
            if(!instr.sprite){
                instr.sprite = {_default: {start: 0, end: instr.duration}};
            }
            bufferCache[instr._url] = buffer;
            instr._gainNode = instr._ctx.createGain();
            instr._gainNode.gain.value = instr.gain;

            if(cb instanceof Function){ cb(); }
        }, function(err){
            // decoding error:
            console.error('An error occurred during decoding ' + instr._url, err);
            if(errCb instanceof Function) { errCb(); }
        });
    };
    Instrument.prototype.play = function(key, options){
        options = options || {};
        key = key || '_default';
        var buffer = bufferCache[this._url],
            spriteItem = this.sprite[key],
            duration = (spriteItem.end - spriteItem.start),
            context = this._ctx,
            playbackRate = (options.playbackRate !== undefined) ? options.playbackRate : 1,
            source;

        if(buffer){
            source = context.createBufferSource();
            source.playbackRate.value = playbackRate;
            source.buffer = buffer;
            source.connect(this._gainNode);
            this._gainNode.connect(context.destination);
            // Some older browsers use noteOn instead of start...
            if(source.start){
                source.start(0, spriteItem.start, duration);
            }else{
                source.noteOn(0, spriteItem.start, duration);
            }
            setTimeout(function(){
                source.stop();
            }, duration * 1000); // sec to ms.
        }else{
            console.error('Could not find sound for ' + this._url + '. Is it loaded?');
        }
    };

    /*
     * Schroeder:
     *
     * Options -
     *      {
     *          format: 'auto'  (mp3 | ogg | m4a | weba | acc | mp4, etc...)
     *      }
     */

    var Schroeder = function(options){
        options = options || {};
        this._ctx = ctx;
        this._instruments = {};
        this._format = options.format || 'auto';
    };
    Schroeder.prototype.unlockAudioContext = function(){
        // unlockAudioContext: used for unlocking WebAudio in iOS
        // create empty buffer
        var buffer = this._ctx.createBuffer(1, 1, 22050);
        var source = this._ctx.createBufferSource();
        source.buffer = buffer;
        // connect to output (your speakers)
        source.connect(this._ctx.destination);
        // play the empty buffer (some older browsers require noteOn instead of start)...
        if(source.start){
            source.start(0);
        }else{
            source.noteOn(0);
        }
    };
    Schroeder.prototype.addInstrument = function(options, cb, errCb){
        options = options || {};
        var instrument;
        if(!this._instruments[options.id]){
            options.ctx = this._ctx;
            options.format = this._format;
            instrument = new Instrument(options);
            instrument.load(cb, errCb);
            this._instruments[options.id] = instrument;
        }else{
            console.error('That sound already seems to exist.');
        }
    };
    Schroeder.prototype.removeInstrument = function(name, options){
        options = options || {};
        var clearCached = (options.cache !== undefined) ? options.cache : false,
            cacheKey;
        if(this._instruments[name]){
            if(clearCached){
                cacheKey = this._instruments[name]._url;
                if(bufferCache[cacheKey]){
                    delete bufferCache[cacheKey];
                }
            }
            delete this._instruments[name];
        }
    };
    Schroeder.prototype.getInstrument = function(name){
        return this._instruments[name];
    };
    Schroeder.prototype.playSound = function(instrName, sound, options){
        var instrument = this._instruments[instrName];
        if(instrument){
            instrument.play(sound, options);
        }else{
            console.error('That sound does not seem to exist.  Have you added it yet?');
        }
    };

    return Schroeder;
})();
