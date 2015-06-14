(function(){
    if(!window.Schroeder){
        window.Schroeder = {};
    }
})();
(function(){
    /*
    Schroeder.Object
    -------------------------
    Defines a simple class that implements a classical inheritance pattern.
    */
    function BaseClass(){}
    BaseClass.prototype.init = function(){};
    BaseClass.__construct__ = function(key, fn, _super){
        return function(){
            var currentSuper = this._super;
            this._super = _super[key];
            var ret = fn.apply(this, arguments);
            this._super = currentSuper;
            return ret;
        };
    };
    BaseClass.create = function(params){
        params = params || {};
        var object, key;
        var Class = function(){};
        Class.prototype = this.prototype;
        object = new Class();
        for(key in params){
            if(params.hasOwnProperty(key)){
                object[key] = params[key];
            }
        }
        if(object.init){
            object.init();
        }
        return object;
    };
    BaseClass.extend = function(params){
        var _super = this.prototype;
        var proto = new this(BaseClass);
        var param;
        for(var key in params){
            param = params[key];
            if(param instanceof Function && _super[key] instanceof Function){
                param = BaseClass.__construct__(key, param, _super);
            }
            proto[key] = param;
        }
        proto._super = _super;

        var Class = function(){
            if(arguments[0] !== BaseClass && this.init){
                this.init.apply(this, arguments);
            }
        };
        Class.prototype = proto;
        Class.prototype.constructor = BaseClass;
        Class.extend = BaseClass.extend;
        Class.create = BaseClass.create;
        return Class;
    };

    Schroeder.Object = BaseClass;
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
     ----------
     _firstSupportedUrl-------------
     */

    var Instrument = Schroeder.Object.extend({
        id: null,
        name: '',
        gain: 1,
        _ctx: null,
        _audioNode: null,
        _gainNode: null,
        _audioData: null,
        format: null,
        sprite: null,
        urls: [],
        _url: null,
        init: function(){
            // temporary until finished with refactor
            if(this.format){
                this._url = this.getUrlForFormat(this.format);
            }else{
                this.pickFirstSupportedFormat();
            }
            // Create nodes...
            this.createAudioNode();
            this.createGainNode();
        },
        pickFirstSupportedFormat: function(){
            var i, url, ext;
            for(i=0; i<this.urls.length; i++){
                url = this.urls[i];
                ext = url.substring(url.lastIndexOf('.') + 1);
                if(Schroeder.CODECS.isSupported(ext)){
                    this.format = ext;
                    this._url = url;
                    break;
                }
            }
        },
        getUrlForFormat: function(format){
            var i, ext, url;
            for(i=0; i<this.urls.length; i++){
                url = this.urls[i];
                ext = url.substring(url.lastIndexOf('.') + 1);
                if(format === ext){
                    return url;
                }
            }
        },
        createGainNode: function(){
            if(this._ctx){
                this._gainNode = this._ctx.createGain();
                this.changeGain(this.gain);
            }else{
                console.error('<Schroeder Instrument>: Unable to create gain node without audio context');
            }
        },
        createAudioNode: function(){
            this._audioNode = new Audio();
            if(this._url){
                this._audioNode.src = this._url;
            }else{
                console.error('<Schroeder Instrument>: Unable to create audio node without source url.');
            }
        },
        changeGain: function(value){
            this._gainNode.gain.value = this.gain = value;
        },
        updateDuration: function(){
            this.duration = Math.ceil(this._audioNode.duration * 10) / 10;
        },
        setAudioData: function(decodedAudioData){
            // presuming that we just loaded new data, updating duration property.
            this.updateDuration();
            if(!this.sprite){
                this.sprite = {_default: {start: 0, end: this.duration}};
            }
            this._audioData = decodedAudioData;
        },
        play: function(key, options){
            options = options || {};
            key = key || '_default';
            var spriteItem = this.sprite[key],
                playbackRate = (options.playbackRate !== undefined) ? options.playbackRate : 1,
                source, duration;

            if(spriteItem && this._audioData){
                duration = (spriteItem.end - spriteItem.start);
                source = this._ctx.createBufferSource();
                source.playbackRate.value = playbackRate;
                try{
                    source.buffer = this._audioData;
                }catch(e){
                    console.error('An error occurred while setting data on the buffer source node.', e);
                }
                source.connect(this._gainNode);
                this._gainNode.connect(this._ctx.destination);
                // Some older browsers use noteOn instead of start...
                if(source.start){
                    source.start(0, spriteItem.start, duration);
                }else{
                    source.noteOn(0, spriteItem.start, duration);
                }
                setTimeout(function(){
                    if(source.stop){
                        source.stop(0);
                    }else{
                        source.noteOff(0);
                    }
                }, duration * 1000); // sec to ms.
            }else{
                console.error('Could not find sound for ' + this._url + '. Is it loaded?');
            }
        }
    });


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
})();
(function(){

    Schroeder.AudioStore = Schroeder.Object.extend({
        init: function(){
            this._createAudioContext();
            this._bufferCache = new Schroeder.BufferCache();
        },
        _instruments: [],
        _createAudioContext: function(){
            var ctx = null;
            try {
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                ctx = new AudioContext();
            }catch(e) {
                console.error('Web Audio API is not supported in this browser', e);
            }
            this._ctx = ctx;
        },
        findInstrumentById: function(instrId){
            var i;
            for(i=0; i<this._instruments.length; i++){
                if(this._instruments[i] && (this._instruments[i].id === instrId)){
                    return this._instruments[i];
                }
            }
        },
        createInstrument: function(options, callback, errCallback){
            options = options || {};

            var instrument;
            var instrOpts = {
                id: options.id,
                name: options.name,
                sprite: options.sprite,
                urls: options.urls || [],
                _ctx: this._ctx,
                format: options.format
            };
            if(instrOpts.id && !this.findInstrumentById(instrOpts.id)){
                instrument = Schroeder.Instrument.create(instrOpts);
                this._loadInstrument(instrument, callback, errCallback);
                this._instruments.push(instrument);
            }else{
                console.error('An instrument already exists with that id.');
                if(errCallback instanceof Function){ errCallback(); }
            }
        },
        removeInstrument: function(instrId, options){
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
        },
        _loadInstrument: function(instrument, cb, errCb){
            var req,
                context = this;
            if(this._bufferCache.has(instrument._url)){
                instrument.setAudioData(this._bufferCache.get(instrument._url));
                cb();
            }else{
                req = new XMLHttpRequest();
                req.open('GET', instrument._url, true);
                req.responseType = 'arraybuffer';
                req.onload = function() {
                    context._decodeInstrument(instrument, req.response, cb, errCb);
                };
                req.onerror = function(e){
                    if(errCb instanceof Function) { errCb(); }
                    console.error('Error occurred while loading audio data for file ' + instrument._url, e);
                };
                req.send();
            }
        },
        _decodeInstrument: function(instrument, arraybuffer, cb, errCb){
            var context = this;
            this._ctx.decodeAudioData(arraybuffer, function(buffer) {
                context._bufferCache.set(instrument._url, buffer);
                instrument.setAudioData(buffer);
                if(cb instanceof Function){ cb(); }
            }, function(err){
                console.error('An error occurred during decoding ' + instrument._url, err);
                if(errCb instanceof Function) { errCb(); }
            });
        },
        playSound: function(instrument, sound, options){
            if(instrument){
                instrument.play(sound, options);
            }else{
                console.error('No instrument provided.  What do you plan to play?');
            }
        },
        unlock: function(){
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
        }
    });
})();
