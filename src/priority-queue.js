/**
 * This class keeps items in sorted order by calling
 * the supplied comparator each time an item is added.
 *
 * @author Anton Eriksson
 */
export default class PriorityQueue {
    /**
     * Construct a PriorityQueue
     *
     * @param {Function} comparator the comparator
     * @param {number} [maxItems=-1] max number of items to keep, -1 to keep all items
     * @param {Iterable} [initialValues] initial values
     */
    constructor(comparator, maxItems = -1, initialValues = []) {
        this.comparator = comparator;
        this.maxItems = maxItems;
        this.items = Array.from(initialValues).sort(this.comparator);
        this._shrinkToSize();
    }

    /**
     * Check number of items in queue
     *
     * @return {number} length of queue
     */
    get length() {
        return this.items.length;
    }

    /**
     * Push an item on the queue
     *
     * @param {*} item
     */
    push(item) {
        this.items.push(item);
        this.items.sort(this.comparator);
        this._shrinkToSize();
    }

    /**
     * Pop an item of the queue
     *
     * @return {*} the item
     */
    pop() {
        return this.items.pop();
    }

    _shrinkToSize() {
        if (this.maxItems > 0) {
            while (this.length > this.maxItems) {
                this.pop();
            }
        }
    }
}
