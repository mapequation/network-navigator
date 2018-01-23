/**
 * Shorthand for console.log
 * @param {Any} msg
 */
export function log(msg) {
    console.log(msg);
}

/**
 * Shorthand for hasOwnProperty
 *
 * @param {Object} obj The object
 * @param {string} prop The property
 * @returns {boolean}
 */
export function has(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * Get file extension, returns undefined if there is no extension
 * (from https://stackoverflow.com/a/680982)
 *
 * @param {File|string} file
 * @returns {?string}
 */
function getFileExt(file) {
    let fileName = file;

    if (has(file, 'name')) {
        fileName = file.name;
    }

    const re = /(?:\.([^.]+))?$/;
    return re.exec(fileName)[1];
}

/**
 * Is File a tree-file?
 * @param {File|string} file
 * @returns {boolean}
 */
export function isTreeFile(file) {
    return getFileExt(file) === 'tree';
}

/**
 * is File a net-file?
 * @param {File|string} file
 * @returns {boolean}
 */
export function isNetFile(file) {
    return getFileExt(file) === 'net';
}
