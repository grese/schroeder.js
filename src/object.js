(function(){
    /*
    Schroeder.Object
    -------------------------
    Defines a simple class that implements a classical inheritance pattern.
    */
    function Class(){}
    Class.prototype.init = function(){};
    Class.__construct__ = function(key, fn, _super){
        return function(){
            var currentSuper = this._super;
            this._super = _super[key];
            var ret = fn.apply(this, arguments);
            this._super = currentSuper;
            return ret;
        };
    };
    Class.extend = function(params){
        var _super = this.prototype;
        var proto = new this(Class);
        var param;
        for(var key in params){
            param = params[key];
            if(param instanceof Function && _super[key] instanceof Function){
                param = Class.__construct__(key, param, _super);
            }
            proto[key] = param;
        }
        proto._super = _super;

        var ClassDef = function(){
            if(arguments[0] !== Class && this.init){
                this.init.apply(this, arguments);
            }
        };
        ClassDef.prototype = proto;
        ClassDef.prototype.constructor = Class;
        ClassDef.extend = arguments.callee;
        return ClassDef;
    };

    Schroeder.Object = Class;
})();
