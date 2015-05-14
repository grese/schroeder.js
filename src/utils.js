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
