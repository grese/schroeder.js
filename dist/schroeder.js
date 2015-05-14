(function(){
    if(!window.Schroeder){
        window.Schroeder = {};
    }
})();
(function(){
    var CodecTester = function(){
        var audio,
            codecList = {};

        try{
            audio = new Audio();
        }catch(e){
            console.error('Audio object is not supported in this browser.', e);
        }
        if(audio){
            codecList = {
                mp3: !!audio.canPlayType('audio/mpeg;').replace(/^no$/, ''),
                opus: !!audio.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ''),
                ogg: !!audio.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
                wav: !!audio.canPlayType('audio/wav; codecs="1"').replace(/^no$/, ''),
                aac: !!audio.canPlayType('audio/aac;').replace(/^no$/, ''),
                m4a: !!(audio.canPlayType('audio/x-m4a;') || audio.canPlayType('audio/m4a;') || audio.canPlayType('audio/aac;')).replace(/^no$/, ''),
                mp4: !!(audio.canPlayType('audio/x-mp4;') || audio.canPlayType('audio/mp4;') || audio.canPlayType('audio/aac;')).replace(/^no$/, ''),
                weba: !!audio.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, '')
            };
        }
        this.isSupported = function(type){
            return (codecList[type] !== undefined) ? codecList[type] : false;
        };
    };

    // Assign a single codec tester to Schroeder
    Schroeder.CODECS = new CodecTester();
})();
(function(){
    /*
     -----------------------
     Instrument
     -----------------------
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
        // assign options to the instrument...
        this.id = options.id || null;
        this.name = options.name || null;
        this.urls = options.urls || [];
        this.sprite = options.sprite;
        this.format = options.format;
        this.gain = (options.gain !== undefined) ? options.gain : 1;
        this._ctx = options.ctx;
        this._url = this.getUrlForCodec(this.format);
        this._audioData = null;

        // Create nodes...
        this._audioNode = new Audio();
        this._audioNode.src = this._url;
        this._gainNode = null;
    };
    Instrument.prototype.getUrlForCodec = function(codec){
        var ext, url;
        for(var i=0; i<this.urls.length; i++){
            url = this.urls[i];
            ext = url.substring(url.lastIndexOf('.') + 1);
            if(codec === ext){
                return url;
            }else if(Schroeder.CODECS.isSupported(ext)){
                return url;
            }
        }
    };
    Instrument.prototype.changeGain = function(value){
        this.gain = value;
        this._gainNode.gain.value = this.gain;
    };
    Instrument.prototype.setAudioData = function(decodedAudioData){
        this.duration = Math.ceil(this._audioNode.duration * 10) / 10;
        if(!this.sprite){
            this.sprite = {_default: {start: 0, end: this.duration}};
        }
        this._audioData = decodedAudioData;
        this._gainNode = this._ctx.createGain();
        this.changeGain(this.gain);
    };
    Instrument.prototype.play = function(key, options){
        options = options || {};
        key = key || '_default';
        var buffer = this._audioData,
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

    Schroeder.Instrument = Instrument;
})();
(function(){
    var BufferCache = function(){
        var _cache = {};

        this.get = function(cacheKey){
            return _cache[cacheKey];
        };
        this.set = function(cacheKey, value){
            _cache[cacheKey] = value;
        };
        this.remove = function(cacheKey){
            delete _cache[cacheKey];
        };
        this.clear = function(){
            _cache = {};
        };
        this.has = function(cacheKey){
            return (this.get(cacheKey) !== undefined) ? true : false;
        };
        this.size = function(){
            return Object.keys(_cache).length;
        };
    };
    Schroeder.BufferCache = BufferCache;

    var AudioStore = function(options){
        options = options || {};
        var ctx = null;
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            ctx = new AudioContext();
        }catch(e) {
            console.error('Web Audio API is not supported in this browser', e);
        }
        this._bufferCache = new Schroeder.BufferCache();
        this._instruments = [];
        this._format = options.format || 'auto';
        this._ctx = ctx;
    };
    AudioStore.prototype.findInstrumentById = function(instrId){
        var i;
        for(i=0; i<this._instruments.length; i++){
            if(this._instruments[i] && (this._instruments[i].id === instrId)){
                return this._instruments[i];
            }
        }
    };
    AudioStore.prototype.createInstrument = function(options){
        options = options || {};
        options.onLoad = options.onLoad || function(){};
        options.onError = options.onError || function(){};

        var instrument;
        var instrOpts = {
            id: options.id,
            name: options.name,
            sprite: options.sprite,
            urls: options.urls || [],
            ctx: this._ctx,
            format: this._format
        };
        if(instrOpts.id && !this.findInstrumentById(instrOpts.id)){
            instrument = new Schroeder.Instrument(instrOpts);
            this._loadInstrument(instrument, options.onLoad, options.onError);
            this._instruments.push(instrument);
        }else{
            console.error('An instrument already exists with that id.');
        }
    };
    AudioStore.prototype._loadInstrument = function(instrument, cb, errCb){
        var req,
            context = this;
        if(this._bufferCache.has(instrument._url)){
            instrument.setAudioData(this._bufferCache.get(instrument._url));
        }else{
            req = new XMLHttpRequest();
            req.open('GET', instrument._url, true);
            req.responseType = 'arraybuffer';
            req.onload = function() {
                context._decodeInstrument(instrument, req.response, cb, errCb);
            };
            req.onerror = function(){
                if(errCb instanceof Function) { errCb(); }
            };
            req.send();
        }
    };
    AudioStore.prototype._decodeInstrument = function(instrument, arraybuffer, cb, errCb){
        var context = this;
        this._ctx.decodeAudioData(arraybuffer, function(buffer) {
            context._bufferCache.set(instrument._url, buffer);
            instrument.setAudioData(context._bufferCache.get(instrument._url));
            if(cb instanceof Function){ cb(); }
        }, function(err){
            console.error('An error occurred during decoding ' + instrument._url, err);
            if(errCb instanceof Function) { errCb(); }
        });
    };
    AudioStore.prototype.removeInstrument = function(instrId, options){
        var i, removalIdx, fileUrl;
        for(i=0; i<this._instruments.length; i++){
            if(this._instruments[i].id === instrId){
                removalIdx = i;
                fileUrl = this._instruments[i]._url;
                break;
            }
        }
        // Remove the instrument from array...
        if(removalIdx !== undefined){
            this._instruments.splice(removalIdx, 1);
        }
        // Delete the url from the bufferCache...
        if(fileUrl){
            this._bufferCache.remove(fileUrl);
        }
    };
    AudioStore.prototype.playSound = function(instrument, sound, options){
        if(instrument){
            instrument.play(sound, options);
        }else{
            console.error('No instrument provided.  What do you plan to play?');
        }
    };
    AudioStore.prototype.unlock = function(){
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

    Schroeder.AudioStore = AudioStore;
})();
