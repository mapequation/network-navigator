/* eslint no-unused-vars: 0 */
import { escapeRegExp, flatMap, maxBy } from "lodash";
import TreePath from "./treepath";


/******************************************
 * Common properties for Network and Node *
 ******************************************/
const hasFlow = (flow = 0) => ({
  flow,
});

const isRenderable = {
  shouldRender: true
};

const treeNode = (id) => ({
  id,
  path: new TreePath(id),
  parent: null
});

const node = () => ({
  kin: 0,
  kout: 0,
  inLinks: [],
  outLinks: []
});


/**
 * A node in a network
 *
 * Internal use only, @see createNode
 */
class Node {
  constructor(name, physicalId) {
    this.name = name.toString();
    this.physicalId = physicalId;
    this.occurred = new Map();
  }

  /**
   * Create a Node
   *
   * @param {number} id the id
   * @param {string} name the name
   * @param {number} flow the flow
   * @param {number} physicalId the physical id
   * @return {Node} the node
   */
  static create(id, name, flow, physicalId) {
    return Object.assign(new Node(name, physicalId), treeNode(id), node(), hasFlow(flow), isRenderable);
  }
}


export const createNode = Node.create;


/**
 * A link in a network
 *
 * Internal use only.
 */
class Link {
  constructor(source, target, flow) {
    this.source = source;
    this.target = target;
    this.flow = flow;
    this.shouldRender = false;
    this._oppositeLink = undefined;
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
  constructor() {
    this._name = undefined;
    this._nodes = new Map();
    this.links = [];
    this.largest = [];
    this.visible = false;
    this.connected = false;
    this.occurrences = new Map();
  }

  /**
   * Create a Network of nodes and links.
   *
   * @param {number|string} id the id
   */
  static create(id) {
    return Object.assign(new Network(), treeNode(id), node(), hasFlow(), isRenderable);
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
    const maxNode = maxBy(children, node => node.flow);
    this._maxNodeFlow = maxNode && maxNode.flow ? maxNode.flow : 0;
    return this._maxNodeFlow;
  }

  get maxNodeEnterFlow() {
    if (this._maxNodeEnterFlow) {
      return this._maxNodeEnterFlow;
    }

    const children = Array.from(traverseDepthFirst(this));
    const maxNode = maxBy(children, node => node.enterFlow);
    this._maxNodeEnterFlow = maxNode && maxNode.enterFlow ? maxNode.enterFlow : 0;
    return this._maxNodeEnterFlow;
  }

  get maxNodeExitFlow() {
    if (this._maxNodeExitFlow) {
      return this._maxNodeExitFlow;
    }

    const children = Array.from(traverseDepthFirst(this));
    const maxNode = maxBy(children, node => node.exitFlow);
    this._maxNodeExitFlow = maxNode && maxNode.exitFlow ? maxNode.exitFlow : 0;
    return this._maxNodeExitFlow;
  }

  get maxLinkFlow() {
    if (this._maxLinkFlow) {
      return this._maxLinkFlow;
    }

    const children = Array.from(traverseDepthFirst(this));
    const maxLink = maxBy(flatMap(children, node => node.links || []), link => link.flow);
    this._maxLinkFlow = maxLink && maxLink.flow ? maxLink.flow : 0;
    return this._maxLinkFlow;
  }

  get maxNodeCount() {
    if (this._maxNodeCount) {
      return this._maxNodeCount;
    }
    const children = Array.from(traverseDepthFirst(this));
    const maxNode = maxBy(children, node => (node.nodes || []).length);
    this._maxNodeCount = maxNode && maxNode.nodes ? maxNode.nodes.length : 0;
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
    const ids = new Map(occurrences.ids.map(id => [id, true]));
    const { fileId } = occurrences;

    for (let node of traverseDepthFirst(this)) {
      if (node.occurrences) {
        if (!node.occurrences.has(fileId)) {
          node.occurrences.set(fileId, {
            count: 0,
            name: occurrences.name,
            color: occurrences.color,
            totalNodes: occurrences.ids.length
          });
        }
        continue;
      }

      if (ids.has(node.name)) {
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


export const createNetwork = Network.create;

/**
 * Factory function for creating node search functions.
 *
 * @param {Network} root the root
 * @return {Function} getNodeByPath
 */
export const makeGetNodeByPath = root => root.getNodeByPath.bind(root);

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
  for (let node of traverseDepthFirst(root)) {
    if (node.links) {
      node.connect();
    }
  }
}

/**
 * Search Network name fields for string matching `name`.
 *
 * @param {Network} root the root of the network
 * @param {string} name the name to search for
 */
export const searchName = (root, name) => root.search(name);

