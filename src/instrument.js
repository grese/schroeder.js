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