(function(){
    // verify support for WebAudio API...
    var ctx = null;
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioContext();
    }catch(e) {
        console.error('Web Audio API is not supported in this browser', e);
    }

    var bufferCache = {};

    var Sound = function(options){
        options = options || {};
        this.audioNode = new Audio();
        this.name = options.name || null;
        this.urls = options.urls || [];
        this.ctx = options.ctx;
        this.sprite = options.sprite;
    };
    Sound.prototype.isValidFormat = function(ext){
        return this.audioNode.canPlayType('audio/' + ext);
    };
    Sound.prototype.getUrl = function(){
        var ext, url;
        for(var i=0; i<this.urls.length; i++){
            url = this.urls[i];
            ext = url.substring(url.lastIndexOf('.') + 1);
            if(this.isValidFormat(ext)){
                return url;
            }
        }
    };
    Sound.prototype.load = function(cb){
        var url = this.getUrl();
        if(!bufferCache[url]){
            var context = this.ctx;
            this.url = this.audioNode.src = url;
            var req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.responseType = 'arraybuffer';
            var self = this;
            // Decode asynchronously
            req.onload = function() {
                context.decodeAudioData(req.response, function(buffer) {
                    bufferCache[url] = buffer;
                    self.setup();
                    if(cb instanceof Function){ cb(); }
                }, function(err){
                    // decoding error:
                    console.error('An error occurred during decoding ' + url, err);
                });
            };
            req.send();
        }
    };
    Sound.prototype.setup = function(){
        console.log(this.audioNode.duration);
        this.duration = Math.ceil(this.audioNode.duration * 10) / 10;

        // Create a sprite map if there is not one provided by options...
        if(!this.sprite){
            this.sprite = {_default: {start: 0, end: this.duration}};
        }
    };
    Sound.prototype.play = function(spriteId){
        spriteId = spriteId || '_default';
        var buffer = bufferCache[this.url],
            spriteItem = this.sprite[spriteId],
            duration = (spriteItem.end - spriteItem.start),
            context = this.ctx,
            source, pos;
        console.log('BUFFER: ', buffer);
        if(buffer){
            pos = spriteItem.start;
            //pos = (this.audioNode._pos > 0) ? node._pos : self._sprite[sprite][0] / 1000;
            source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(context.destination);
            source.start(0, pos, duration);
            setTimeout(function(){
                source.stop();
            }, duration * 1000);
        }else{
            console.error('Could not find sound for ' + this.url + '. Is it loaded?');
        }
    };

    var Schroeder = function(){
        this._numSounds = 0;
        this._ctx = ctx;
        this._sounds = {};
    };
    Schroeder.prototype.addSound = function(options, cb){
        options = options || {};
        var sound;
        if(!this._sounds[options.name]){
            options.format = this._format;
            options.ctx = this._ctx;
            sound = new Sound(options);
            sound.load(cb);
            this._sounds[options.name] = sound;
            this._numSounds++;
        }
    };
    Schroeder.prototype.playSound = function(name, spriteKey){
        var sound = this._sounds[name];
        sound.play(spriteKey);
    };

    if(window.Schroeder === undefined){
        window.Schroeder = Schroeder;
    }
})();