/**
 * Class that represents a path in a tree
 *
 * @author Anton Eriksson
 */
export default class TreePath {
    /**
     * Construct a new TreePath
     *
     * @param {number|string|number[]} path
     */
    constructor(path) {
        if (Array.isArray(path)) {
            this.path = path.join(':');
        } else if (typeof path === 'number') {
            this.path = path.toString();
        } else if (typeof path === 'string') {
            this.path = path;
        } else {
            throw new TypeError('Arguments has wrong type!');
        }
    }

    /**
     * Construct a TreePath from two paths
     *
     * @param {TreePath|string} parentPath
     * @param {string|number} path
     */
    static join(parentPath, path) {
        return new TreePath([parentPath.toString(), path.toString()].join(':'));
    }

    /**
     * Create a DOM friendly id
     *
     * @return {string} the id
     */
    toId() {
        let path = this.toString();

        if (TreePath.isTreePath(path)) {
            path = path.replace(/:/g, '-');
        }

        return `id-${path}`;
    }

    /**
     * Get path as string
     *
     * @return {string} the path
     */
    toString() {
        return this.path;
    }

    /**
     * Get path as array
     *
     * @see TreePath.toArray
     *
     * @return {number[]}
     */
    toArray() {
        return TreePath.toArray(this.path);
    }

    /**
     * Split a tree path string to array and parse to integer.
     *
     * @example
     * > treePathToArray('1:1')
     * [1, 1]
     * > treePathToArray('1')
     * [1]
     * > treePathToArray(1)
     * [1]
     * > treePathToArray('root')
     * [ NaN ]
     *
     * @param {string|number} path A string in format "1:1:2:1"
     * @return {number[]}
     */
    static toArray(path) {
        return path
            .toString()
            .split(':')
            .map(Number);
    }

    /**
     * Check if path matches the format 1:1:1
     * (repeating digit and colon ending with digit)
     *
     * @param {*} path
     * @return {boolean}
     */
    static isTreePath(path) {
        return /^(\d+:)*\d+$/.test(path.toString());
    }
}
