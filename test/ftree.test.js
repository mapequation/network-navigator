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
        expect(ft.isTreePath('1:2:3')).to.equal(true);
    });

    it('should return false if an otherwise correct path ends with colon', function () {
        expect(ft.isTreePath('1:1:')).to.equal(false);
    });

    it('should return false for a non-integer string', function () {
        expect(ft.isTreePath('root')).to.equal(false);
    })
});

describe('parseFtree', function () {
    it('should work', function () {

    });
});

describe('createTree', function () {
    it('should parse simple data', function () {
        const data = [
            ['1:1', 0.1, 'Name 1', 1],
            ['1:2', 0.1, 'Name 2', 2],
            ['*Links', 'directed'],
            ['*Links', 'root', 0, 2, 2],
            [1, 2, 0.1],
            [2, 1, 0.1],
        ];
        expect(ft.parseFTree(data)).to.deep.equal({
            data: {
                tree: [
                    { path: [1, 1], flow: 0.1, name: 'Name 1', node: 1},
                    { path: [1, 2], flow: 0.1, name: 'Name 2', node: 2},
                ],
                links: [
                    {
                        path: 'root',
                        exitFlow: 0,
                        numEdges: 2,
                        numChildren: 2,
                        links: [
                            { source: 1, target: 2, flow: 0.1 },
                            { source: 2, target: 1, flow: 0.1 },
                        ],
                    },
                ],
            },
            errors: [],
            meta: {
                linkType: 'directed',
            },
        });
    });

    it('should produce error if tree section has a row which don\'t contain 4 fields', function () {
        const data = [
            ['1:1', 0.1, 'Name 1'],
            ['1:2', 0.1, 'Name 2', 2],
            ['*Links', 'directed'],
            ['*Links', 'root', 0, 2, 2],
            [1, 2, 0.1],
            [2, 1, 0.1],
        ];
        const result = ft.parseFTree(data);
        expect(result.errors.length).to.equal(1);
    });

    it('should produce error if there is no tree data', function () {
        const data = [
            ['*Links', 'directed'],
            ['*Links', 'root', 0, 2, 2],
            [1, 2, 0.1],
            [2, 1, 0.1],
        ];
        const result = ft.parseFTree(data);
        expect(result.errors.length).to.equal(1);
    });

    it('should produce error if link type is missing', function () {
        const data = [
            ['1:1', 0.1, 'Name 1', 1],
            ['1:2', 0.1, 'Name 2', 2],
            ['*Links', 'root', 0, 2, 2],
            [1, 2, 0.1],
            [2, 1, 0.1],
        ];
        const result = ft.parseFTree(data);
        expect(result.errors.length).to.equal(1);
    });

    it('should produce 2 errors if a links header don\'t contain 5 fields', function () {
        const data = [
            ['1:1', 0.1, 'Name 1', 1],
            ['1:2', 0.1, 'Name 2', 2],
            ['*Links', 'directed'],
            ['*Links', 'root', 0, 2],
            [1, 2, 0.1],
            [2, 1, 0.1],
        ];
        const result = ft.parseFTree(data);
        expect(result.errors.length).to.equal(2);
    });

    it('should produce error if there is a link which contains less than 2 fields', function () {
        const data = [
            ['1:1', 0.1, 'Name 1', 1],
            ['1:2', 0.1, 'Name 2', 2],
            ['*Links', 'directed'],
            ['*Links', 'root', 0, 2, 2],
            [1],
            [2, 1, 0.1],
        ];
        const result = ft.parseFTree(data);
        expect(result.errors.length).to.equal(1);
    });

    it('should produce error if there is no link data', function () {
        const data = [
            ['1:1', 0.1, 'Name 1', 1],
            ['1:2', 0.1, 'Name 2', 2],
            ['*Links', 'directed'],
        ];
        const result = ft.parseFTree(data);
        expect(result.errors.length).to.equal(1);
    });
});
