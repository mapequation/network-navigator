/**
 * Parse whitespace separated multi-line strings to list of strings
 *
 * Example
 * '123 0.222 "aoeu htns"' -> ['123', '0.222', '"aoeu htns"']
 *
 * @param str The input string with whitespace separated values
 * @returns object with fields determined by *section(s) in string with array of fields,
 * or -- if no sections where found -- everything is in the 'default' field
 */
import {isFloat, isInt, isNumeric, isQuoted, l} from "./utils";

export function readString(str) {
    let data = {};
    const lines = str.split('\n');
    const dataLines = lines.filter(notCommentedLine);

    let section = 'default';
    data[section] = [];

    for (let line of dataLines) {

        if (sectionLine(line)) {
            section = line.substr(1).trim();
            data[section] = data[section] || [];
            continue;
        }

        const re = /"[^"]*"|\S+/g;
        let found = line.match(re);

        if (found) {
            data[section].push(found);
        }
    }

    return data;
}

/**
 * Removes quotes from strings and tries to parse numbers to integers or floats
 *
 * @param data
 * @returns object The parsed data
 */
export function transformTreeData(data) {
    let sections = Object.keys(data);

    for (let section of sections) {
        for (let line = 0; line < data[section].length; line++) {
            data[section][line] = data[section][line]
                .map(unQuote)
                .map(parseTreePathField)
                .map(parseNum);
        }
    }

    return data;
}

/**
 * Parse strings with three paths delimited by colon (:) to an array of integers
 * or the original string if there was no match
 *
 * Example
 * '1:1:1' -> [1, 1, 1]
 *
 * @param field
 * @returns {array | string}
 */
function parseTreePathField(field) {
    const re = /^([0-9]+:)+[0-9]+$/g;
    if (field.match(re)) {
        return field.split(':').map(parseNum);
    }

    return field;
}

/**
 * Remove citation marks from beginning and end of string
 *
 * @param str
 * @returns {string}
 */
function unQuote(str) {
    if (isQuoted(str)) {
        return str.substr(1, str.length - 2);
    }

    return str;
}

/**
 * A line is a comment if it starts with '#'
 *
 * @param line
 * @returns {boolean}
 */
function commentedLine(line) {
    return line.startsWith('#');
}

/**
 * Negated form of commentedLine
 *
 * @param line
 * @returns {boolean}
 */
function notCommentedLine(line) {
    return !commentedLine(line);
}

/**
 * A line defines a new section if it starts with '*'
 *
 * @param line
 * @returns {boolean}
 */
function sectionLine(line) {
    return line.startsWith('*');
}

/**
 * Parse string to int or float
 *
 * @param num
 * @returns {number | string} depending on success
 */
function parseNum(num) {
    if (isNumeric(num)) {
        if (isFloat(+num)) {
            return parseFloat(num);
        } else if (isInt(+num)) {
            return parseInt(num); // TODO not needed?
        }
    }

    return num;
}
