/**
 * This class implements the subject part of the subject-observer
 * pattern. All observers should implement the update() method.
 *
 * @author Anton Eriksson
 */
export default class Observable {
    constructor() {
        this.observers = [];
        this.eventHandlers = new Map();
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

        if (message.type && this.eventHandlers.get(message.type)) {
            this.eventHandlers
                .get(message.type)
                .forEach(handler => handler(message));
        }

        return this;
    }

    on(messageType, event) {
        const handlers = this.eventHandlers.get(messageType) || [];
        this.eventHandlers.set(messageType, handlers);
        handlers.push(event);

        return this;
    }
}
