(function(){
    if(!Schroeder.Test){
        Schroeder.Test = {
            audioContext: new AudioContext(),
            // Schroeder.Test.async helper (wrapper for sinon.useFakeTimers):
            async: {
                clock: null,
                setup: function(){
                    this.clock = sinon.useFakeTimers();
                },
                reset: function(){
                    this.clock.restore();
                },
                throttle: function(callback, ms){
                    var timer;
                    return function(){
                        clearTimeout(timer);
                        var args = [].slice.call(arguments);
                        timer = setTimeout(function(){
                            callback.apply(this, args);
                        }, ms);
                    }
                }
            },
            // Schroeder.Test.ajax helper (wrapper for sinon.useFakeXMLHttpRequest):
            ajax: {
                xhr: null,
                requests: [],
                mostRecent: function(){
                    return this.requests[this.requests.length - 1];
                },
                setup: function(){
                    this.xhr = sinon.useFakeXMLHttpRequest();
                    var self = this;
                    this.xhr.onCreate = function(xhr){
                        self.requests.push(xhr);
                    };
                },
                reset: function(){
                    this.xhr.restore();
                    this.requests = [];
                }
            }
        };
    }
    // max of 6 AudioContexts allowed in browser (hardware limitation), so
    // overriding this method to reuse the one from Schroeder.Test.
    Schroeder.AudioStore.prototype._createAudioContext = function(){
        this._ctx = Schroeder.Test.audioContext;
    };

    // global beforeEach and afterEach loops...
    beforeEach(function(){
        Schroeder.Test.ajax.setup();
        Schroeder.Test.async.setup();
    });

    afterEach(function(){
        Schroeder.Test.async.reset();
        Schroeder.Test.ajax.reset();
        sinon.restore();
    });
})();
