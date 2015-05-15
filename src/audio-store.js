(function(){
    var AudioStore = function(options){
        options = options || {};
        this._createAudioContext();
        this._bufferCache = new Schroeder.BufferCache();
        this._instruments = [];
    };
    AudioStore.prototype._createAudioContext = function(){
        var ctx = null;
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            ctx = new AudioContext();
        }catch(e) {
            console.error('Web Audio API is not supported in this browser', e);
        }
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
    AudioStore.prototype.createInstrument = function(options, callback, errCallback){
        options = options || {};

        var instrument;
        var instrOpts = {
            id: options.id,
            name: options.name,
            sprite: options.sprite,
            urls: options.urls || [],
            ctx: this._ctx,
            format: options.format
        };
        if(instrOpts.id && !this.findInstrumentById(instrOpts.id)){
            instrument = new Schroeder.Instrument(instrOpts);
            this._loadInstrument(instrument, callback, errCallback);
            this._instruments.push(instrument);
        }else{
            console.error('An instrument already exists with that id.');
            if(errCallback instanceof Function){ errCallback(); }
        }
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
    AudioStore.prototype._loadInstrument = function(instrument, cb, errCb){
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
    };
    AudioStore.prototype._decodeInstrument = function(instrument, arraybuffer, cb, errCb){
        var context = this;
        this._ctx.decodeAudioData(arraybuffer, function(buffer) {
            context._bufferCache.set(instrument._url, buffer);
            instrument.setAudioData(buffer);
            if(cb instanceof Function){ cb(); }
        }, function(err){
            console.error('An error occurred during decoding ' + instrument._url, err);
            if(errCb instanceof Function) { errCb(); }
        });
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
