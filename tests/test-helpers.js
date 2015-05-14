(function(){
    if(!Schroeder.Test){
        Schroeder.Test = {
            audioContext: new AudioContext()
        };
    }
    // max of 6 AudioContexts allowed in browser (hardware limitation), so
    // overriding this method to reuse the one from Schroeder.Test.
    Schroeder.AudioStore.prototype._createAudioContext = function(){
        this._ctx = Schroeder.Test.audioContext;
    };
})();
