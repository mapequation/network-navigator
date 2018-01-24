import Papa from 'papaparse';

export default Papa;

/**
 * Promise wrapper for Papa.parse
 *
 * @param {(File|string)} file The file passed to Papa.parse
 * @param {Object} opts The config object passed to Papa.parse
 * @returns {Promise}
 */
Papa.parsePromise = function (file, opts) {
    return new Promise((complete, error) =>
        Papa.parse(file, Object.assign(opts, { complete, error })));
};

/**
 * Split a tree path string to array and parse to integer.
 *
 * @param {string} pathStr
 * @return {number[]}
 */
export function treePathToArray(pathStr) {
    const arr = pathStr.split(':');
    return arr.map(Number);
}

export function processFile(file) {
    const parseOpts = {
        comments: '#',
        delimiter: ' ',
        quoteChar: '"',
        dynamicTyping: true,
        skipEmptyLines: true,
    };

    return Papa.parsePromise(file, parseOpts);
}

export function parseSections(arr) {
    const net = {};
    let currentSection = null;
    let foundSection = false;

    arr.forEach((row) => {
        if (row[0][0] === '*') {
            // new section
            currentSection = row[0].slice(1).toLowerCase();
            net[currentSection] = net[currentSection] || [];
            foundSection = true;
        } else if (currentSection != null) {
            // push all data to current section
            net[currentSection].push(row);
        }
    });

    if (!foundSection) {
        net.default = arr;
    }

    return net;
}
