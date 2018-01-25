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
 * Parse file with Papa.parsePromise using a default config object.
 *
 * @param {(File|string)} file The file passed to Papa.parsePromise
 * @return {Promise}
 */
export function processFile(file) {
    const defaultOpts = {
        comments: '#',
        delimiter: ' ',
        quoteChar: '"',
        dynamicTyping: true,
        skipEmptyLines: true,
    };

    return Papa.parsePromise(file, defaultOpts);
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
 * @param {string} pathStr A string in format "1:1:2:1"
 * @return {number[]}
 */
function treePathToArray(pathStr) {
    const arr = pathStr.toString().split(':');
    return arr.map(Number);
}

/**
 * Check if path matches the format 1:1:1
 * (repeating digit and colon ending with digit)
 *
 * @param {*} path
 * @return {boolean}
 */
function isTreePath(path) {
    return path.toString().match(/^(\d+:)*\d+$/);
}

/**
 *
 * @param {array[]} arr parsed by Papa.parse
 * @return {Object}
 */
export function partitionSections(arr) {
    const result = {
        data: {
            tree: [
                /*
                {
                    path,
                    flow,
                    name,
                    node,
                },
                ...
                */
            ],
            links: [
                /*
                {
                    path,
                    exitFlow,
                    numEdges,
                    numChildren,
                    links: [
                        { source, target, flow },
                        ...
                    ],
                },
                ...
                */
            ],
        },
        errors: [],
        meta: {
            linkType: undefined,
        },
    };

    let line = 0;

    for (; line < arr.length; line++) {
        const row = arr[line];

        if (row[0].toString().startsWith('*')) break;

        result.data.tree.push({
            path: isTreePath(row[0]) ? treePathToArray(row[0]) : row[0],
            flow: row[1],
            name: row[2],
            node: row[3],
        });
    }

    if (result.data.tree.length === 0) {
        result.errors.push('No tree data found!');
    }

    if (arr[line] && arr[line][1].match(/(un)?directed/i)) {
        result.meta.linkType = arr[line][1].trim().toLowerCase();
        line++;
    } else {
        result.errors.push(`Expected link type at row ${line}!`);
    }

    let link = {
        path: null,
        exitFlow: null,
        numEdges: null,
        numChildren: null,
        links: [],
    };

    for (; line < arr.length; line++) {
        const row = arr[line];

        if (row[0].toString().match(/^\*Links/i)) {
            link = {
                path: isTreePath(row[1]) ? treePathToArray(row[1]) : row[1],
                exitFlow: row[2],
                numEdges: row[3],
                numChildren: row[4],
                links: [],
            };

            result.data.links.push(link);
        } else {
            link.links.push({
                source: row[0],
                target: row[1],
                flow: row[2] || 1,
            });
        }
    }

    if (result.data.links.length === 0) {
        result.errors.push('No link data found!');
    }

    return result;
}
