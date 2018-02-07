/* eslint-env mocha */
import { expect } from 'chai';
import * as ft from '../src/file-formats/ftree';

describe('treePathToArray', function () {
    it('should parse integers', function () {
        expect(ft.treePathToArray(1)).to.deep.equal([1]);
    });

    it('should parse integer strings', function () {
        expect(ft.treePathToArray('1')).to.deep.equal([1]);
    });

    it('should parse integer strings separated by colon', function () {
        expect(ft.treePathToArray('1:2:3')).to.deep.equal([1, 2, 3]);
    });
});

describe('isTreePath', function () {
    it('should return true for integers', function () {
        expect(ft.isTreePath(1)).to.equal(true);
    });

    it('should return true for integer strings', function () {
        expect(ft.isTreePath('1')).to.equal(true);
    });

    it('should return true for integer strings separated by colon', function () {
        expect(ft.isTreePath('1:2:3')).equal(true);
    });

    it('should return false if an otherwise correct path ends with colon', function () {
        expect(ft.isTreePath('1:1:')).equal(false);
    });

    it('should return false for a non-integer string', function () {
        expect(ft.isTreePath('root')).equal(false);
    })
});
