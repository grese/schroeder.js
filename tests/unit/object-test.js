
(function(){
    var expect = chai.expect;

    describe('Schroeder.Object', function(){

        it('should exist, and be an Object', function(){
            expect(Schroeder.Object).to.be.an.instanceof(Object);
        });

        it('should allow extension of the base Schroeder.Object class, and should call the init function ' +
            'on instantiation.', function(){
            var initSpy = sinon.spy();
            var ExtendedClass = Schroeder.Object.extend({
                init: initSpy,
                someProperty: 'someValue'
            });
            var object = new ExtendedClass();
            expect(object).to.be.an.instanceof(Schroeder.Object);
            expect(initSpy.called).to.be.ok;
            expect(object.someProperty).to.eq('someValue');
        });

        it('should assign a this._super property to any function passed to extend which also exists on parent class', function(){
            var SuperClass = Schroeder.Object.extend({
                doSomethingCalledBy: null,
                doSomethingHasSuper: false,
                doSomething: function(){
                    this.doSomethingCalledBy = 'SUPER';
                    this.doSomethingHasSuper = (this._super instanceof Function);
                }
            });
            var SubClass = SuperClass.extend({
                doSomething: function(){
                    this.doSomethingCalledBy = 'SUB';
                    this.doSomethingHasSuper = (this._super instanceof Function);
                    this._super();
                }
            });

            // SuperClass objects should NOT have a this._super method in doSomething...
            var superClass = new SuperClass();
            superClass.doSomething();
            expect(superClass.doSomethingHasSuper).not.to.be.ok;
            expect(superClass.doSomethingCalledBy).to.eq('SUPER');

            // SubClass objects should have a this._super method in doSomething because the parent class has doSomething...
            var subClass = new SubClass();
            subClass.doSomething();
            expect(subClass.doSomethingHasSuper).to.be.ok;
            expect(superClass.doSomethingCalledBy).to.eq('SUPER');
        });

    });
})();
