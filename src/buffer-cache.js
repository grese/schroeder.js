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
