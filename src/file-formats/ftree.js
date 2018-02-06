import { Tree } from '../tree';

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
 * Parse ftree data to object, consuming data array.
 *
 * @example
 *  // Input example
 *  [
 *      ["1:1:1", 0.0564732, "Atlanta, GA: Hartsfield-Jackson Atlanta International;", 29],
 *      ["1:1:2", 0.00662063, "Memphis, TN: Memphis International;", 286],
 *      ["1:1:3", 0.00251202, "Newark, NJ: Newark Liberty International;New York, NY: John F. Kennedy International;New York, NY: LaGuardia;", 146],
 *      ["1:1:4", 0.00245953, "Fort Lauderdale, FL: Fort Lauderdale-Hollywood International;Miami, FL: Miami International;", 155],
 *      ...
 *      ["*Links", "directed"],
 *      ["*Links", "root", 0, 68, 208],
 *      [2, 1, 0.000107451],
 *      [1, 2, 0.0000830222],
 *      [3, 1, 0.00000900902],
 *      ...
 *  ]
 *
 *
 * @example
 *  // Return value structure
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
 * @param {Array[]} rows ftree-file as array (rows) of arrays (fields)
 * @return {Object}
 */
export function parseFTree(rows) {
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

    const DEFAULT_FLOW = 1;

    const { tree, links } = result.data;

    // 1. Parse tree section
    // ftree-files has sections of *Links following the tree data
    while (rows.length && !rows[0][0].toString().startsWith('*')) {
        const row = rows.shift();

        if (row.length !== 4) {
            result.errors.push(`Malformed ftree data: expected 4 fields, found ${row.length}.`);
            break;
        }

        tree.push({
            path: isTreePath(row[0]) ? treePathToArray(row[0]) : row[0],
            flow: row[1],
            name: row[2],
            node: row[3],
        });
    }

    if (!tree.length) {
        result.errors.push('No tree data found!');
    }

    // 2. Get link type
    if (rows[0] && rows[0][1].toString().match(/(un)?directed/i)) {
        const row = rows.shift();
        result.meta.linkType = row[1].trim().toLowerCase();
    } else {
        result.errors.push('Expected link type!');
    }

    let link = {
        links: [],
    };

    // 3. Parse links section
    while (rows.length) {
        const row = rows.shift();

        // 3a. Parse link header
        if (row[0].toString().match(/^\*Links/i)) {
            if (row.length !== 5) {
                result.errors.push(`Malformed ftree link header: expected 5 fields, found ${row.length}.`);
                break;
            }

            link = {
                path: isTreePath(row[1]) ? treePathToArray(row[1]) : row[1],
                exitFlow: row[2],
                numEdges: row[3],
                numChildren: row[4],
                links: [],
            };

            links.push(link);

        // 3b. Parse link data
        } else {
            if (row.length < 2) {
                result.errors.push(`Malformed ftree link data: expected at least 2 fields, found ${row.length}.`);
                break;
            }

            link.links.push({
                source: row[0],
                target: row[1],
                flow: row[2] || DEFAULT_FLOW,
            });
        }
    }

    if (!links.length) {
        result.errors.push('No link data found!');
    }

    return result;
}

/**
 * Create tree from ftree data
 *
 * @param {Object} opts
 * @param {Object[]} opts.treeData
 * @param {Object[]} opts.linkData
 * @return {Tree}
 */
export function createTree({ treeData, linkData }) {
    const tree = new Tree();

    linkData.forEach((node) => {
        // Get root node links
        if (node.path === 'root') {
            tree.root.links = node.links;

        // For all other nodes
        } else {
            const childNode = node.path
                .reduce((pathNode, childId) => pathNode.getChild(childId) || pathNode.createChild(childId), tree.root);

            childNode.path = node.path.join(':');
            childNode.exitFlow = node.exitFlow;
            childNode.links = node.links;
        }
    });

    treeData.forEach((node) => {
        const childNode = node.path
            .reduce((pathNode, childId) => {
                pathNode.flow += node.flow;
                return pathNode.getChild(childId) || pathNode.createChild(childId);
            }, tree.root);

        childNode.path = node.path.join(':');
        childNode.flow = node.flow;
        childNode.name = node.name;
    });

    return tree;
}
