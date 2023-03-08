/* eslint no-unused-vars: 0 */
/**
 * @file This file deals with converting a Network to the
 * [FTree format]{@link http://www.mapequation.org/code.html#FTree-format}
 * as a string.
 *
 * The format is extended to allow for module names.
 *
 * @see parseFTree
 * @see Network
 * @see networkFromFTree
 *
 * @author Anton Holmgren
 */

import { byFlow } from "../lib/filter";
import { traverseBreadthFirst, traverseDepthFirst } from "../lib/network";
import flowFormat from "./flow-format";


/**
 * Serialize Network to FTree string.
 *
 * @param {Network} network
 */
export default function ftreeFromNetwork(network) {
  let modules = "";
  let nodes = "";
  let links = "";

  for (let node of traverseBreadthFirst(network)) {
    if (node.nodes) {
      if (node.path.toString() !== "root") {
        modules += `${node.path} ${flowFormat(node.flow)} "${node.name}" ${flowFormat(node.exitFlow)}\n`;
      }
    }
  }

  for (let node of traverseDepthFirst(network)) {
    if (!node.nodes) {
      nodes += `${node.path} ${flowFormat(node.flow)} "${node.name}" ${node.physicalId}\n`;
    } else {
      links += `*Links ${node.path} ${flowFormat(node.enterFlow)} ${flowFormat(node.exitFlow)} ${node.links.length} ${node.nodes.length}\n`;
      for (let link of node.links.sort(byFlow)) {
        links += `${link.source.id} ${link.target.id} ${flowFormat(link.flow)}\n`;
      }
    }
  }

  return [
    "*Modules\n",
    "# path flow name exitFlow\n",
    modules,
    "*Nodes\n",
    "# path flow name node\n",
    nodes,
    `*Links ${network.directed ? "directed" : "undirected"}\n`,
    "#*Links path enterFlow exitFlow numEdges numChildren\n",
    links
  ].join("");
}
