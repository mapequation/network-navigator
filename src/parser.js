/**
 * Parse whitespace separated multi-line strings
 *
 * @param str The input string with whitespace separated values
 * @returns object with fields determined by *section(s) in string with array of fields,
 * or -- if no sections where found -- everything in the 'default' field
 */
let Parser = function (str) {
    // Commented lines start with '#'
    function notCommented(line) {
        return line.indexOf('#') !== 0;
    }

    const rows = str.split('\n').filter(notCommented);

    let section = 'default';
    let fileData = {};
    fileData[section] = [];

    function parseLine(line) {
        if (line[0] === '*') {
            section = line.substr(1).trim();
            fileData[section] = fileData[section] || [];
        } else {
            /* Pair of double quotes with anything inside (including whitespace)
               or
               anything except whitespace.
             */
            const re = /"[^"]*"|\S+/g;
            let found = line.match(re);
            if (!found) return;
            fileData[section].push(found);
        }
    }

    rows.forEach(parseLine);

    return fileData;
};

module.exports = Parser;
