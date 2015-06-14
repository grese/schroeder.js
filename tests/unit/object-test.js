
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
            var object = ExtendedClass.create();
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
            var superClass = SuperClass.create();
            superClass.doSomething();
            expect(superClass.doSomethingHasSuper).not.to.be.ok;
            expect(superClass.doSomethingCalledBy).to.eq('SUPER');

            // SubClass objects should have a this._super method in doSomething because the parent class has doSomething...
            var subClass = SubClass.create();
            subClass.doSomething();
            expect(subClass.doSomethingHasSuper).to.be.ok;
            expect(superClass.doSomethingCalledBy).to.eq('SUPER');
        });

        it('should allow classes created with #extend to be instantiated with #create, and properties should be assigned to the new instance.', function(){
            var Parent = Schroeder.Object.extend({
                id: null,
                name: '',
                sayHello: function(){
                    return 'Parent ' + this.id + ': ' + this.name;
                }
            });

            var Child = Parent.extend({
                sayHello: function(){
                    return 'Child ' + this.id + ': ' + this.name;
                },
                play: function(){
                    return 'Woo-Hoo!';
                }
            });

            var parent = Parent.create({
                id: 1,
                name: 'John'
            });
            var child = Child.create({
                id: 2,
                name: 'Schroeder'
            });

            expect(parent).to.be.an.instanceof(Schroeder.Object);
            expect(parent.sayHello()).to.eq('Parent 1: John');
            expect(child).to.be.an.instanceof(Parent);
            expect(child.sayHello()).to.eq('Child 2: Schroeder');
            expect(child.play()).to.eq('Woo-Hoo!');
        });

    });


})();
