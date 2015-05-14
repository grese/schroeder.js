(function(){
    function throttle(callback) {

    return function () {
        clearTimeout(timer);
        var args = [].slice.call(arguments);
        timer = setTimeout(function () {
            callback.apply(this, args);
        }, 100);
    };
    }
    if(!Schroeder.Test){
        Schroeder.Test = {
            audioContext: new AudioContext(),
            clock: null,
            throttle: function(ms, callback){
                var timer;
                return function(){
                    clearTimeout(timer);
                    var args = [].slice.call(arguments);
                    timer = setTimeout(function(){
                        callback.apply(this, args);
                    }, ms);
                }
            }
        };
    }
    // max of 6 AudioContexts allowed in browser (hardware limitation), so
    // overriding this method to reuse the one from Schroeder.Test.
    Schroeder.AudioStore.prototype._createAudioContext = function(){
        this._ctx = Schroeder.Test.audioContext;
    };

    // global before, after, beforeEach and afterEach loops...
    beforeEach(function(){
        Schroeder.Test.clock = sinon.useFakeTimers();
    });

    afterEach(function(){
        Schroeder.Test.clock.restore();
    });
})();
