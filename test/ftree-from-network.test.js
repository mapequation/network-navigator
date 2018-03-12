import { expect } from 'chai';
import { flowFormat } from '../src/file-formats/ftree-from-network';

describe('flowFormat', () => {
    it('should return "0" for 0', () => {
        expect(flowFormat(0)).to.equal('0');
    });

    it('should return the number as is for numbers with fewer than 9 decimals', () => {
        expect(flowFormat(0.1234)).to.equal('0.1234');
    })

    it('should return fixed point with max 9 decimals for numbers larger than 1e-4', () => {
        expect(flowFormat(0.123456789123456)).to.equal('0.123456789');
    });

    it('should return exponential for numbers smaller than 1e-4', () => {
        expect(flowFormat(1e-5)).to.equal('1e-05');
    });

    it('should return exponential with maximum 5 sigsificants', () => {
        expect(flowFormat(1.234567890e-5)).to.equal('1.23456e-05');
    });
});
