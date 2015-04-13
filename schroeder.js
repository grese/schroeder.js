(function(){
    // verify support for WebAudio API...
    var ctx = null;
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioContext();
    }catch(e) {
        console.error('Web Audio API is not supported in this browser', e);
    }

    var CodecTester = function(){
        var audio = new Audio();
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
    var CODECS = new CodecTester();

    var bufferCache = {};

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
    Instrument.prototype.load = function(cb){
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
                instr.decode(req.response, cb);
            };
            req.send();
        }
    };
    Instrument.prototype.decode = function(arraybuffer, cb){
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
    Schroeder.prototype.addInstrument = function(options, cb){
        options = options || {};
        var instrument;
        if(!this._instruments[options.name]){
            options.ctx = this._ctx;
            options.format = this._format;
            instrument = new Instrument(options);
            instrument.load(cb);
            this._instruments[options.name] = instrument;
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

    return new Schroeder();
})();
