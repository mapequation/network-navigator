/**
 * Shorthand for console.log
 * @param msg
 */
export function l(msg) {
    console.log(msg);
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
 * Returns true if string is surrounded by the character
 *
 * @param str
 * @param ch character
 * @returns {boolean}
 */
export function isSurroundedBy(str, ch) {
    return str[0] === ch && str[str.length-1] === ch;
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
    return num === +num && num !== (num|0);
}

/**
 * Is num an integer?
 * (from https://stackoverflow.com/a/3885844)
 *
 * @param num
 * @returns {boolean}
 */
export function isInt(num) {
    return num === +num && num === (num|0);
}
