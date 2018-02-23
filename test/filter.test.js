/* eslint-env mocha */
import { expect } from 'chai';
import * as filter from '../src/filter';

describe('byFlow', function () {
    it('should return greater than 0 when obj1 has less flow than obj2', function () {
        const obj1 = { flow: 0 };
        const obj2 = { flow: 1 };
        expect(filter.byFlow(obj1, obj2)).to.be.greaterThan(0);
    });

    it('should return 0 when comparing objects with equal flow', function () {
        const obj1 = { flow: 1 };
        const obj2 = { flow: 1 };
        expect(filter.byFlow(obj1, obj2)).to.be.equal(0);
    });

    it('should return less than 0 when obj1 has more flow than obj2', function () {
        const obj1 = { flow: 1 };
        const obj2 = { flow: 0 };
        expect(filter.byFlow(obj1, obj2)).to.be.lessThan(0);
    });
});

describe('sumFlow', function () {
    it('should sum the flow', function () {
        const objs = [
            { flow: 1 },
            { flow: 2 },
            { flow: 3 },
        ];
        expect(filter.sumFlow(objs)).to.equal(6);
    });

    it('should return 0 for empty array', function () {
        expect(filter.sumFlow([])).to.equal(0);
    })
});

describe('connectedNodes', function () {
    it('should return connected nodes', function () {
        const nodes = [
            { id: 1 },
            { id: 2 },
        ];
        const links = [
            { source: nodes[0], target: nodes[1] },
        ];
        expect(filter.connectedNodes({ nodes, links })).to.deep.equal(nodes);
    });

    it('should filter disconnected nodes', function () {
        const nodes = [
            { id: 1 },
            { id: 2 },
            { id: 3 },
        ];
        const links = [
            { source: nodes[0], target: nodes[1] },
        ];
        expect(filter.connectedNodes({ nodes, links })).to.deep.equal([
            { id: 1 },
            { id: 2 },
        ]);
    });
});

describe('connectedLinks', function () {
    it('should return connected links', function () {
        const nodes = [
            { id: 1 },
            { id: 2 },
        ];
        const links = [
            { source: nodes[0], target: nodes[1] },
        ];
        expect(filter.connectedLinks({ nodes, links })).to.deep.equal(links);
    });

    it('should filter disconnected links', function () {
        const nodes = [
            { id: 1 },
            { id: 2 },
        ];
        const links = [
            { source: nodes[0], target: nodes[1] },
            { source: nodes[0], target: { id: 3 } },
        ];
        expect(filter.connectedLinks({ nodes, links })).to.deep.equal([
            { source: nodes[0], target: nodes[1] },
        ]);
    });
});

describe('takeLargest', function () {
    it('should return all objects if there are fewer objects than "amount"', function() {
        const objs = [1, 2];
        expect(filter.takeLargest(objs, 3)).to.deep.equal(objs);
    });

    it('should sort the objects by flow (descending)', function () {
        const objs = [
            { flow: 1 },
            { flow: 2 },
        ];
        expect(filter.takeLargest(objs, 2)).to.deep.equal([
            { flow: 2 },
            { flow: 1 },
        ]);
    });

    it('should only return "amount" number of objects', function () {
        const objs = [
            { flow: 2 },
            { flow: 1 },
        ];
        expect(filter.takeLargest(objs, 1)).to.deep.equal([
            { flow: 2 },
        ]);
    });

    it('should return the "amount" largest objects', function () {
        const objs = [
            { flow: 1 },
            { flow: 3 },
            { flow: 2 },
        ];

        expect(filter.takeLargest(objs, 2)).to.deep.equal([
            { flow: 3 },
            { flow: 2 },
        ]);
    });
});

describe('accumulateLargest', function () {
    it('should return all objects if flowFactor is 1', function () {
        const objs = [
            { flow: 1 },
            { flow: 1 },
        ];
        expect(filter.accumulateLargest(objs, 1)).to.deep.equal([
            { flow: 1 },
            { flow: 1 },
        ]);
    });

    it('should return no objects if flowFactor is 0', function () {
        const objs = [
            { flow: 1 },
        ];
        expect(filter.accumulateLargest(objs, 0)).to.deep.equal([]);
    });

    it('should return objects sorted by flow (descending)', function () {
        const objs = [
            { flow: 1 },
            { flow: 2 },
            { flow: 3 },
        ];
        expect(filter.accumulateLargest(objs, 1)).to.deep.equal([
            { flow: 3 },
            { flow: 2 },
            { flow: 1 },
        ]);
    });

    it('should accumulate objects until flowFactor is reaced', function () {
        const objs = [
            { flow: 1 },
            { flow: 2 },
            { flow: 3 },
        ];
        expect(filter.accumulateLargest(objs, 0.5)).to.deep.equal([
            { flow: 3 },
        ]);
    });

    it('should not delete from input objects', function () {
        const objs = [
            { flow: 1 },
        ];
        filter.accumulateLargest(objs, 1);
        expect(objs.length).to.equal(1);
    });
});

