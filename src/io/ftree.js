/**
 * @file This file deals with parsing data in the
 * [FTree format]{@link http://www.mapequation.org/code.html#FTree-format}
 * to an object representation.
 * The data should be split into lines and fields.
 *
 * @author Anton Holmgren
 */

/**
 * Parse ftree data to object.
 *
 * The input can optionally have the Modules extension to the ftree format.
 *
 * @example
 *  // Input example
 *  [
 *      ["*Modules", 4], // optional section
 *      ["1", 0.5, "ModuleName 1", 0.4],
 *      // ...
 *      ["*Nodes", 10] // optional header
 *      ["1:1:1", 0.0564732, "Name 1", 29],
 *      ["1:1:2", 0.0066206, "Name 2", 286],
 *      ["1:1:3", 0.0025120, "Name 3", 146],
 *      ["1:1:4", 0.0024595, "Name 4", 155],
 *      // ...
 *      ["*Links", "directed"],
 *      ["*Links", "root", 0, 0, 68, 208],
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
 *              { path, flow, name, stateNode?, node },
 *              // ...
 *          ],
 *          links: [
 *              {
 *                  path,
 *                  name, // optional
 *                  enterFlow,
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
 *          directed,
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
      links: []
    },
    errors: [],
    meta: {
      directed: true
    }
  };

  const modules = new Map();
  const { tree, links } = result.data;

  let i = 0;

  // 0. Parse modules section
  if (/\*Modules/i.test(rows[i][0].toString())) {
    // Consume modules header
    i++;

    const nodesHeader = /\*(Nodes|Tree)/i;

    for (; i < rows.length && !nodesHeader.test(rows[i][0].toString()); i++) {
      const row = rows[i];

      if (row.length !== 4) {
        result.errors.push(`Malformed ftree data: expected 4 fields, found ${row.length} when parsing modules.`);
        continue;
      }

      modules.set(row[0], {
        path: row[0],
        flow: row[1],
        name: row[2],
        exitFlow: row[3]
      });
    }

    // Consume a line if current line is a header
    if (nodesHeader.test(rows[i][0].toString())) {
      i++;
    }
  }

  // 1. Parse tree section
  // ftree-files has sections of *Links following the tree data
  for (; i < rows.length && !/\*Links/i.test(rows[i][0].toString()); i++) {
    const row = rows[i];

    if (row.length < 4 || row.length > 6) {
      result.errors.push(`Malformed ftree data: expected 4 to 6 fields, found ${row.length} when parsing tree.`);
      continue;
    }

    const node = {
      path: row[0],
      flow: row[1],
      name: row[2],
      node: row[row.length - 1]
    };

    if (row.length === 5) {
      node.stateNode = row[3];
    }

    tree.push(node);
  }

  if (!tree.length) {
    result.errors.push("No tree data found!");
  }

  // 2. Get link type
  if (rows[i] && /(un)?directed/i.test(rows[i][1].toString())) {
    result.meta.directed = rows[i][1].trim().toLowerCase() === "directed";
    i++;
  } else {
    result.errors.push("Could not read link type. Expected '*Links [un]directed'. Are you loading a .tree file? The Network Navigator requires .ftree files.");
  }

  let link = {
    links: []
  };

  // 3. Parse links section
  let isOldFormat = false; // missing enterFlow before Infomap v1.0.0
  for (; i < rows.length; i++) {
    const row = rows[i];

    // 3a. Parse link header #*Links path enterFlow exitFlow numEdges numChildren
    if (/^\*Links/i.test(row[0].toString())) {
      if (row.length < 6) {
        if (row.length === 5) {
          // result.errors.push(`The ftree link header is missing one field, the required six fields are available from Infomap v1.0.`);
          if (!isOldFormat) {
            console.warn('Detected old ftree format (missing enterFlow on modules). Use Infomap v1.0+ for the latest format.');
          }
          isOldFormat = true;
        } else {
          result.errors.push(`Malformed ftree link header: expected 6 fields, found ${row.length} when parsing links header.`);
          continue;
        }
      }

      const enterFlowOffset = row.length === 5 ? -1 : 0;

      link = {
        path: row[1],
        enterFlow: row[2],
        exitFlow: row[3 + enterFlowOffset],
        numEdges: row[4 + enterFlowOffset],
        numChildren: row[5 + enterFlowOffset],
        links: []
      };

      const mod = modules.get(link.path);

      if (mod) {
        link.name = mod.name;
      }

      links.push(link);

      // 3b. Parse link data
    } else {
      if (row.length !== 3) {
        result.errors.push(`Malformed ftree link data: expected 3 fields, found ${row.length} when parsing links.`);
        continue;
      }

      link.links.push({
        source: row[0],
        target: row[1],
        flow: row[2]
      });
    }
  }

  if (!links.length) {
    result.errors.push("No link data found!");
  }

  return result;
}
