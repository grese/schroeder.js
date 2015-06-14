(function(){
    /*
    Schroeder.Object
    -------------------------
    Defines a simple class that implements a classical inheritance pattern.
    */
    function BaseClass(){}
    BaseClass.prototype.init = function(){};
    BaseClass.__construct__ = function(key, fn, _super){
        return function(){
            var currentSuper = this._super;
            this._super = _super[key];
            var ret = fn.apply(this, arguments);
            this._super = currentSuper;
            return ret;
        };
    };
    BaseClass.create = function(params){
        params = params || {};
        var object, key;
        var Class = function(){};
        Class.prototype = this.prototype;
        object = new Class();
        for(key in params){
            if(params.hasOwnProperty(key)){
                object[key] = params[key];
            }
        }
        if(object.init){
            object.init();
        }
        return object;
    };
    BaseClass.extend = function(params){
        var _super = this.prototype;
        var proto = new this(BaseClass);
        var param;
        for(var key in params){
            param = params[key];
            if(param instanceof Function && _super[key] instanceof Function){
                param = BaseClass.__construct__(key, param, _super);
            }
            proto[key] = param;
        }
        proto._super = _super;

        var Class = function(){
            if(arguments[0] !== BaseClass && this.init){
                this.init.apply(this, arguments);
            }
        };
        Class.prototype = proto;
        Class.prototype.constructor = BaseClass;
        Class.extend = BaseClass.extend;
        Class.create = BaseClass.create;
        return Class;
    };

    Schroeder.Object = BaseClass;
})();
