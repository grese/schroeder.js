var test = require("simple-test-framework");
 
test("Your project works",function(t) {
 
   var a = 1;
   t.check(a === 1,"a equals 1");
   t.test("Your subtest succeedes",function(t) {
   
      t.check(a === 1,"a still equals 1");
      
      t.finish();
   });
   
   t.finish();
});