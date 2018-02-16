/**
 * @file This file deals with parsing data in the
 * [FTree format]{@link http://www.mapequation.org/code.html#FTree-format}
 * to an object representation.
 * The data should be split into lines and fields.
 *
 * @author Anton Eriksson
 */


/**
 * Parse ftree data to object.
 *
 * @example
 *  // Input example
 *  [
 *      ["1:1:1", 0.0564732, "Name 1", 29],
 *      ["1:1:2", 0.0066206, "Name 2", 286],
 *      ["1:1:3", 0.0025120, "Name 3", 146],
 *      ["1:1:4", 0.0024595, "Name 4", 155],
 *      // ...
 *      ["*Links", "directed"],
 *      ["*Links", "root", 0, 68, 208],
 *      [2, 1, 0.000107451],
 *      [1, 2, 0.0000830222],
 *      [3, 1, 0.00000900902],
 *      // ...
 *  ]
 *
 *
 * @example
 *  // Return value structure
 *  {
 *      data: {
 *          tree: [
 *              { path, flow, name, node },
 *              // ...
 *          ],
 *          links: [
 *              {
 *                  path,
 *                  exitFlow,
 *                  numEdges,
 *                  numChildren,
 *                  links: [
 *                      { source, target, flow },
 *                      // ...
 *                  ],
 *              },
 *              // ...
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
export default function parseFTree(rows) {
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

    let i = 0;

    // 1. Parse tree section
    // ftree-files has sections of *Links following the tree data
    for (; i < rows.length && !rows[i][0].toString().startsWith('*'); i++) {
        const row = rows[i];

        if (row.length !== 4) {
            result.errors.push(`Malformed ftree data: expected 4 fields, found ${row.length}.`);
            continue;
        }

        tree.push({
            path: row[0],
            flow: row[1],
            name: row[2],
            node: row[3],
        });
    }

    if (!tree.length) {
        result.errors.push('No tree data found!');
    }

    // 2. Get link type
    if (rows[i] && /(un)?directed/i.test(rows[i][1].toString())) {
        result.meta.linkType = rows[i][1].trim().toLowerCase();
        i++;
    } else {
        result.errors.push('Expected link type!');
    }


    let link = {
        links: [],
    };

    // 3. Parse links section
    for (; i < rows.length; i++) {
        const row = rows[i];

        // 3a. Parse link header
        if (/^\*Links/i.test(row[0].toString())) {
            if (row.length !== 5) {
                result.errors.push(`Malformed ftree link header: expected 5 fields, found ${row.length}.`);
                continue;
            }

            link = {
                path: row[1],
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
                continue;
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
