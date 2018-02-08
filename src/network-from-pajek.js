/**
 * @file This file deals with creating a network from pajek data.
 *
 * @see parsePajek
 *
 * @author Christopher Blöcker
 */

import Network from 'network';

export default function networkFromPajek({ nodes, links })
{
  const root = new Network("root");
  root.path  = "root";

  nodes.forEach((node) =>
  {
    var theNode  = root.createNode(node.id);
    theNode.name = node.label;
  })

  root.links = links;
  console.log(links)

  return root;
}
