(function(){
    // Fill the Audio & AudioContext variables because they are not available in PhantomJS.
    if (/PhantomJS/.test(window.navigator.userAgent)) {
        console.log("PhantomJS environment detected. Mocking WebAudio API objects.");
        if(!window.Audio){
            window.Audio = function(){
                this.canPlayType = function(){ return 'no'; };
            };
        }
        if(!window.AudioContext){
            window.AudioContext = function(){
                this.createGain = function(){ return {}; };
            };
        }
    }
})();
