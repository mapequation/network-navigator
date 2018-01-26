import Papa from 'papaparse';

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
export function parseFile(file) {
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
 * Parse ftree data to object.
 *
 * The object representation is returned in the following structure:
 * @code
 *  {
 *      data: {
 *          tree: [
 *              { path, flow, name, node },
 *              ...
 *          ],
 *          links: [
 *              {
 *                  path,
 *                  exitFlow,
 *                  numEdges,
 *                  numChildren,
 *                  links: [
 *                      { source, target, flow },
 *                      ...
 *                  ],
 *              },
 *              ...
 *          ],
 *      },
 *      errors: [],
 *      meta: {
 *          linkType,
 *      },
 *  }
 *
 * @param {array[]} arr ftree-file parsed as array (lines) of arrays (fields)
 * @return {Object}
 */
export function partitionSections(arr) {
    const result = {
        data: {
            tree: [],
            links: [],
        },
        errors: [],
        meta: {
            linkType: undefined,
        },
    };

    const { tree, links } = result.data;

    while (arr.length) {
        if (arr[0][0].toString().startsWith('*')) break;

        const row = arr.shift();

        tree.push({
            path: isTreePath(row[0]) ? treePathToArray(row[0]) : row[0],
            flow: row[1],
            name: row[2],
            node: row[3],
        });
    }

    if (tree.length === 0) {
        result.errors.push('No tree data found!');
    }

    if (arr[0] && arr[0][1].match(/(un)?directed/i)) {
        const row = arr.shift();
        result.meta.linkType = row[1].trim().toLowerCase();
    } else {
        result.errors.push('Expected link type!');
    }

    let link = {
        links: [],
    };

    while (arr.length) {
        const row = arr.shift();

        if (row[0].toString().match(/^\*Links/i)) {
            link = {
                path: isTreePath(row[1]) ? treePathToArray(row[1]) : row[1],
                exitFlow: row[2],
                numEdges: row[3],
                numChildren: row[4],
                links: [],
            };

            links.push(link);
        } else {
            link.links.push({
                source: row[0],
                target: row[1],
                flow: row[2] || 1,
            });
        }
    }

    if (links.length === 0) {
        result.errors.push('No link data found!');
    }

    return result;
}
