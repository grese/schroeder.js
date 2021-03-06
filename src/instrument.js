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
