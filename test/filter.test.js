/* eslint-env mocha */
import { expect } from 'chai';
import * as filter from '../src/filter';

describe('byFlow', function () {
    it('should should return greater than 0 when obj1 is smaller than obj2', function () {
        const obj1 = { flow: 0 };
        const obj2 = { flow: 1 };
        expect(filter.byFlow(obj1, obj2)).to.be.greaterThan(0);
    });

    it('should should return 0 when comparing the same object', function () {
        const obj1 = { flow: 0 };
        expect(filter.byFlow(obj1, obj1)).to.be.equal(0);
    });

    it('should should return less than 0 when obj1 is greater than obj2', function () {
        const obj1 = { flow: 1 };
        const obj2 = { flow: 0 };
        expect(filter.byFlow(obj1, obj2)).to.be.lessThan(0);
    });
});
