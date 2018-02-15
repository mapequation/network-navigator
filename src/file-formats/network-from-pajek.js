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
    theNode.flow = node.flow;
    theNode.path = node.id.toString();
  })

  root.links = links;

  return root;
}
