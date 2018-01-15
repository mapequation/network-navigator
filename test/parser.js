let assert = require('assert');
let Parser = require('../src/parser');

describe('Parser', function() {
   it('should not split on spaces inside quotes', function() {
       const string = '123 "456 789" 123';
       const parsed = Parser(string);
       assert.deepEqual(parsed.default[0], ['123', '"456 789"', '123']);
   });

   it('should not include commented lines', function() {
      const string = '# commented line\ndata';
      const parsed = Parser(string);
      assert.equal(parsed.default[0], 'data');
   });

   it('should group data into sections', function() {
       const string = '* section\ndata';
       const parsed = Parser(string);
       assert.equal(parsed.section[0], 'data');
   });

   it('should handle multiple sections', function() {
       const string = '* section\ndata-1\n* another_section\ndata-2';
       const parsed = Parser(string);
       assert.equal(parsed.section[0], 'data-1');
       assert.equal(parsed.another_section[0], 'data-2');
   });

   it('should split on tabs', function() {
       const string = '123\t456';
       const parsed = Parser(string);
       assert.deepEqual(parsed.default[0], ['123', '456']);
   })
});
