/**
 * Shorthand for console.log
 * @param msg
 */
export default function log(msg) {
    console.log(msg);
}

/**
 * Shorthand for hasOwnProperty
 *
 * @param obj The object
 * @param prop The property
 * @returns {boolean}
 */
export function has(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * Returns true if string is surrounded by the character
 *
 * @param str
 * @param ch character
 * @returns {boolean}
 */
export function isSurroundedBy(str, ch) {
    return str[0] === ch && str[str.length - 1] === ch;
}

/**
 * A string is quoted if it is wrapped by the characters " or '
 *
 * @param str
 * @returns {boolean}
 */
export function isQuoted(str) {
    return isSurroundedBy(str, '"') || isSurroundedBy(str, '\'');
}

/**
 * Remove citation marks from beginning and end of string
 *
 * @param str
 * @returns {string}
 */
export function unQuote(str) {
    if (isQuoted(str)) {
        return str.substr(1, str.length - 2);
    }

    return str;
}

/**
 * Check if a string is numeric
 * (from https://stackoverflow.com/a/9716488)
 *
 * @param num
 * @returns {boolean}
 */
export function isNumeric(num) {
    return !isNaN(parseFloat(num)) && isFinite(num);
}

/**
 * Is num a floating point number?
 * (from https://stackoverflow.com/a/3885844)
 *
 * @param num
 * @returns {boolean}
 */
export function isFloat(num) {
    return num === +num && num !== (num | 0);
}

/**
 * Is num an integer?
 * (from https://stackoverflow.com/a/3885844)
 *
 * @param num
 * @returns {boolean}
 */
export function isInt(num) {
    return num === +num && num === (num | 0);
}

/**
 * Get file extension, returns undefined if there is no extension
 * (from https://stackoverflow.com/a/680982)
 *
 * @param file
 * @returns {string | undefined}
 */
function getFileExt(file) {
    let fileName = file;

    if ('name' in file) {
        fileName = file.name;
    }

    const re = /(?:\.([^.]+))?$/;
    return re.exec(fileName)[1];
}

/**
 * Is File a tree-file?
 * @param file
 * @returns {boolean}
 */
export function isTreeFile(file) {
    return getFileExt(file) === 'tree';
}

/**
 * is File a net-file?
 * @param file
 * @returns {boolean}
 */
export function isNetFile(file) {
    return getFileExt(file) === 'net';
}
