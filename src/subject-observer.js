/**
 * This class implements the subject part of the subject-observer
 * pattern. All observers should implement the update() method.
 *
 * @author Anton Eriksson
 */
export default class Subject {
    constructor() {
        this.observers = [];
    }

    attach(observer) {
        this.observers.push(observer);
    }

    detach(observer) {
        const i = this.observers.indexOf(observer);
        this.observers.splice(i, 1);
    }

    notify(message) {
        this.observers.forEach(observer => observer.update(message));
    }
}
