import { escapeRegExp, flatMap, maxBy } from "lodash";
import TreePath from "./treepath";


/**
 * A node in a network
 */
class Node {
  kin = 0;
  kout = 0;
  inLinks = [];
  outLinks = [];
  parent = null;
  shouldRender = true;
  occurred = new Map();
  exitFlow = 0;

  constructor(id, name, flow, physicalId) {
    this.id = id;
    this.path = new TreePath(id);
    this.flow = flow;
    this.name = name.toString();
    this.physicalId = physicalId;
  }
}


export const createNode = (id, name, flow, physicalId) =>
  new Node(id, name, flow, physicalId);


/**
 * A link in a network
 *
 * Internal use only.
 */
class Link {
  shouldRender = false;
  _oppositeLink = undefined;

  constructor(source, target, flow) {
    this.source = source;
    this.target = target;
    this.flow = flow;
    source.outLinks.push(this);
    target.inLinks.push(this);
    source.kout++;
    target.kin++;
  }

  get oppositeLink() {
    if (this._oppositeLink) {
      return this._oppositeLink;
    }

    this._oppositeLink = this.source.inLinks.find(link => link.source === this.target);

    if (this._oppositeLink) {
      this._oppositeLink.oppositeLink = this;
    }

    return this._oppositeLink;
  }

  set oppositeLink(oppositeLink) {
    this._oppositeLink = oppositeLink;
  }
}


/**
 * A network of nodes and links
 *
 * Internal use only, @see createNetwork
 */
class Network {
  kin = 0;
  kout = 0;
  inLinks = [];
  outLinks = [];
  parent = null;
  shouldRender = true;
  flow = 0;
  exitFlow = 0;
  visible = false;
  connected = false;
  _name = undefined;
  _nodes = new Map();
  links = [];
  largest = [];
  occurrences = new Map();

  constructor(id) {
    this.id = id;
    this.path = new TreePath(id);
  }

  addNode(child) {
    this._nodes.set(child.id, child);
  }

  getNode(childId) {
    return this._nodes.get(childId);
  }

  get nodes() {
    if (!this._nodesArray) {
      this._nodesArray = Array.from(this._nodes.values());
    }
    return this._nodesArray;
  }

  get name() {
    return this._name || this.largest.map(node => node.name).join(", ");
  }

  set name(name) {
    this._name = name;
  }

  get totalChildren() {
    if (this._totalChildren) {
      return this._totalChildren;
    }

    this._totalChildren = this.nodes.reduce((total, node) =>
      total += node.nodes ? node.totalChildren : 1, 0);

    return this._totalChildren;
  }

  get maxNodeFlow() {
    if (this._maxNodeFlow) {
      return this._maxNodeFlow;
    }

    const children = Array.from(traverseDepthFirst(this));
    this._maxNodeFlow = maxBy(children, node => node.flow).flow;
    return this._maxNodeFlow;
  }

  get maxNodeExitFlow() {
    if (this._maxNodeExitFlow) {
      return this._maxNodeExitFlow;
    }

    const children = Array.from(traverseDepthFirst(this));
    this._maxNodeExitFlow = maxBy(children, node => node.exitFlow).exitFlow;
    return this._maxNodeExitFlow;
  }

  get maxLinkFlow() {
    if (this._maxLinkFlow) {
      return this._maxLinkFlow;
    }

    const children = Array.from(traverseDepthFirst(this));
    this._maxLinkFlow = maxBy(flatMap(children, node => node.links || []), link => link.flow).flow;
    return this._maxLinkFlow;
  }

  get maxNodeCount() {
    if (this._maxNodeCount) {
      return this._maxNodeCount;
    }
    const children = Array.from(traverseDepthFirst(this));
    this._maxNodeCount = maxBy(children, node => (node.nodes || []).length).nodes.length;
    return this._maxNodeCount;
  }

  /**
   * Get the child node that matches the path.
   *
   * @param {string} path the path formatted like "1:2:3"
   * @return {?(Network|Node)} the node
   */
  getNodeByPath(path) {
    if (path.toString() === this.path.toString()) {
      return this;
    }

    return TreePath.toArray(path)
      .reduce((parent, id) => parent.getNode(id), this);
  }

  connect() {
    if (this.connected) return;
    this.connected = true;

    this.links = this.links.map(l => {
      const source = this.getNode(l.source);
      const target = this.getNode(l.target);
      const link = new Link(source, target, l.flow);
      source.outLinks.push(link);
      target.inLinks.push(link);
      source.kout++;
      target.kin++;
      return link;
    });
  }

  search(name) {
    const entireNetwork = Array.from(traverseDepthFirst(this));

    entireNetwork.forEach(node => node.searchHits = 0);

    if (!name.length) return [];

    try {
      const re = new RegExp(escapeRegExp(name), "i");

      return entireNetwork
        .filter((node) => {
          if (node.nodes) return false;

          node.searchHits = +re.test(node.name);

          if (node.searchHits > 0) {
            for (let parent of ancestors(node)) {
              parent.searchHits++;
            }
          }

          return node.searchHits > 0;
        });
    } catch (e) {
      return [];
    }
  }

  markOccurrences(occurrences) {
    const physicalIds = new Map(occurrences.physicalIds.map(id => [id, true]));
    const { fileId } = occurrences;

    for (let node of traverseDepthFirst(this)) {
      if (node.occurrences) {
        if (!node.occurrences.has(fileId)) {
          node.occurrences.set(fileId, {
            count: 0,
            name: occurrences.name,
            color: occurrences.color,
            totalNodes: occurrences.physicalIds.length
          });
        }
        continue;
      }

      if (physicalIds.has(node.physicalId)) {
        node.occurred.set(fileId, {
          name: occurrences.name,
          color: occurrences.color
        });

        for (let parent of ancestors(node)) {
          parent.occurrences.get(fileId).count++;
        }
      }
    }
  }

  clearOccurrences() {
    for (let node of traverseDepthFirst(this)) {
      if (node.occurrences) {
        node.occurrences.clear();
      } else {
        node.occurred.clear();
      }
    }
  }
}


export const createNetwork = id => new Network(id);

/**
 * Pre-order traverse all nodes below.
 *
 * @param {Network} root the root node
 * @yields {Network|Node} the nodes
 */
export function* traverseDepthFirst(root) {
  const queue = [root];
  while (queue.length) {
    const node = queue.pop();
    yield node;
    if (node.nodes) {
      queue.push(...[...node.nodes].reverse());
    }
  }
}

/**
 * Breadth first traverse all nodes below.
 *
 * @param {Network} root the root node
 * @yields {Network|Node} the nodes
 */
export function* traverseBreadthFirst(root) {
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    yield node;
    if (node.nodes) {
      queue.push(...node.nodes);
    }
  }
}

export function* ancestors(treeNode) {
  let parent = treeNode.parent;

  while (parent) {
    yield parent;
    parent = parent.parent;
  }
}

/**
 * Connect all links in network
 *
 * @param {Network} root the root of the network
 */
export function connectLinks(root) {
  root.connect();

  if (root.nodes) {
    for (let node of root.nodes) {
      if (node.links) {
        node.connect();
      }
    }
  }
  //for (let node of traverseDepthFirst(root)) {
  //  if (node.links) {
  //    node.connect();
  //  }
  //}
}
