import { expect } from 'chai';
import TreePath from '../src/treepath';

describe('TreePath', function () {
    it('should parse integers', function () {
        expect(TreePath.toArray(1)).to.deep.equal([1]);
    });

    it('should parse integer strings', function () {
        expect(TreePath.toArray('1')).to.deep.equal([1]);
    });

    it('should parse integer strings separated by colon', function () {
        expect(TreePath.toArray('1:2:3')).to.deep.equal([1, 2, 3]);
    });

    it('should return true for integers', function () {
        expect(TreePath.isTreePath(1)).to.equal(true);
    });

    it('should return true for integer strings', function () {
        expect(TreePath.isTreePath('1')).to.equal(true);
    });

    it('should return true for integer strings separated by colon', function () {
        expect(TreePath.isTreePath('1:2:3')).to.equal(true);
    });

    it('should return false if an otherwise correct path ends with colon', function () {
        expect(TreePath.isTreePath('1:1:')).to.equal(false);
    });

    it('should return false for a non-integer string', function () {
        expect(TreePath.isTreePath('root')).to.equal(false);
    })
});
