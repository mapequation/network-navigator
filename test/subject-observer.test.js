import Subject from '../src/subject-observer';
import { expect } from 'chai';

describe('Subject', function () {
    let subject;
    const observer = { update(message) { } }

    beforeEach(function () {
        subject = new Subject();
    })

    it('should accept observers', function () {
        subject.attach(observer);
        expect(subject.observers.length).to.equal(1);
    });

    it('should be able to detach observers', function () {
        subject.attach(observer);
        subject.detach(observer);
        expect(subject.observers.length).to.equal(0);
    });

    it('should notify all observers', function () {
        const obs1 = {
            message: null,
            update(m) { this.message = m }
        };
        const obs2 = {
            message: null,
            update(m) { this.message = m }
        };
        subject.attach(obs1);
        subject.attach(obs2);
        const message = 'test';
        subject.notify(message);
        expect(obs1.message).to.equal(message)
        expect(obs2.message).to.equal(message)
    })
});
