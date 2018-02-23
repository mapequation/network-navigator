/**
 * This class keeps items in sorted order by calling
 * the supplied comparator each time an item is added.
 *
 * @author Anton Eriksson
 */
export default class PriorityQueue {
    /**
     * Construct a PriorityQueue
     * @param {number} maxItems max number of items to keep,
     *                          -1 to keep all items
     * @return {PriorityQueue}
     */
    constructor(comparator, maxItems = -1) {
        this.comparator = comparator;
        this.maxItems = maxItems;
        this.items = [];
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
     * Map over items in queue
     *
     * @param {Function} callback
     */
    map(callback) {
        return this.items.map(callback);
    }

    /**
     * Invoke callback for each item in queue
     *
     * @param {Function} callback
     */
    forEach(callback) {
        return this.items.forEach(callback);
    }

    /**
     * Push an item on the queue
     *
     * @param {*} item
     */
    push(item) {
        this.items.push(item);
        this.items.sort(this.comparator);
        if (this.maxItems > 0 && this.length > this.maxItems) {
            this.pop();
        }
    }

    /**
     * Pop an item of the queue
     *
     * @return {*} the item
     */
    pop() {
        return this.items.pop();
    }
}
