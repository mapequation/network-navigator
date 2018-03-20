import * as d3 from 'd3';
import { clickHandler, doubleClickHandler } from 'click-handler';
import makeDragHandler from 'drag-handler';
import { traverseDepthFirst } from 'network';

const ellipsis = (text, len = 25) => (text.length > len ? `${text.substr(0, len - 3)}...` : text);
const capitalizeWord = word => word && word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
const capitalize = str => str.split(' ').map(capitalizeWord).join(' ');
const nodeName = node => capitalize(ellipsis(node.name || node.largest.map(childNode => childNode.name).join(', ')))
const numberOfHits = n =>
    +n.marked || Array.from(traverseDepthFirst(n)).filter(child => child.marked).length;


export default class NetworkSimulation {
    constructor(linkRenderer, renderStyle, center, parentElement, labelsElement, { charge, linkDistance }) {
        this.simulation = d3.forceSimulation()
            .force('collide', d3.forceCollide(20))
            .force('link', d3.forceLink().distance(linkDistance))
            .force('charge', d3.forceManyBody()
                .strength(-charge)
                .distanceMax(400))
            .force('center', d3.forceCenter(center.x, center.y))
            .on('tick', this.update.bind(this))
            .stop();

        this.linkRenderer = linkRenderer;
        this.style = renderStyle;
        this.event = d3.dispatch('click', 'dblclick', 'mouseover', 'mouseout');
        this.dragHandler = makeDragHandler(this.simulation);
        this.elements = {
            parent: parentElement,
            labels: labelsElement,
        };
    }

    init({ nodes, links }) {
        this.nodes = nodes.filter(node => node.shouldRender);
        this.links = links.filter(link => link.shouldRender).reverse();

        this.createElements();

        this.simulation.nodes(this.nodes);

        this.simulation.force('link')
            .links(this.links);

        if (this.simulation.alpha() < 1) {
            this.simulation.alpha(0.8);
        } else {
            for (let i = 0; i < 30; i++) {
                this.simulation.tick();
            }
        }

        this.simulation.restart();
    }

    createElements() {
        const self = this;
        const { elements } = this;
        const { parent, labels } = elements;

        parent.selectAll('*').remove();
        labels.selectAll('*').remove();

        elements.link = parent.append('g')
            .attr('class', 'links')
            .selectAll('.link')
            .data(this.links)
            .enter()
            .append('path')
            .attr('class', 'link')
            .style('fill', this.style.linkFillColor);

        elements.link.accessors = {
            path: this.linkRenderer,
            visible: (() => {
                const len = this.links.length || 1;
                const visible = d3.scaleSqrt().domain([0.2, 2.5]).range([1 / len, 1]).clamp(true);
                return k => l => 1 - l.index / len <= visible(k);
            })(),
        };

        elements.node = parent.append('g')
            .attr('class', 'nodes')
            .selectAll('.node')
            .data(this.nodes)
            .enter()
            .append('g')
            .attr('id', n => n.path.toId())
            .on('click', clickHandler(function (n) { self.event.call('click', this, n) }))
            .on('dblclick', doubleClickHandler(function (n) { self.event.call('dblclick', this, n) }))
            .on('mouseover', function (n) { self.event.call('mouseover', this, n) })
            .on('mouseout', function (n) { self.event.call('mouseout', this, n) })
            .call(this.dragHandler);

        elements.circle = elements.node.append('circle')
            .attr('r', this.style.nodeRadius)
            .style('fill', this.style.nodeFillColor)
            .style('stroke', this.style.nodeBorderColor)
            .style('stroke-width', this.style.nodeBorderWidth);

        elements.searchMark = elements.node.append('circle')
            .attr('r', n => this.style.searchMarkRadius(numberOfHits(n)))
            .style('fill', '#F48074');

        elements.label = labels.selectAll('.label')
            .data(this.nodes)
            .enter()
            .append('text')
            .attr('class', 'label')
            .text(nodeName)
            .attr('text-anchor', 'left')
            .style('fill', 'black')
            .style('font-size', 12)
            .style('paint-order', 'stroke')
            .style('stroke', 'white')
            .style('stroke-width', '1.5px')
            .style('stroke-linecap', 'square')
            .style('stroke-linejoin', 'round');

        elements.label.accessors = {
            x: n => n.x,
            y: n => n.y,
            dx: n => 1.1 * this.style.nodeRadius(n),
            visible: (() => {
                const visible = d3.scaleLinear().domain([0.2, 0.8]).range([1, this.nodes.length]).clamp(true);
                return k => n => n.id <= visible(k);
            })(),
            visibility: n => 'visible',
            text: nodeName,
        };
    }

    update() {
        const { circle, searchMark, label, link } = this.elements;

        circle
            .attr('cx', n => n.x)
            .attr('cy', n => n.y);
        searchMark
            .attr('r', n => this.style.searchMarkRadius(numberOfHits(n)))
            .attr('cx', n => n.x)
            .attr('cy', n => n.y);
        label
            .text(label.accessors.text)
            .attr('x', label.accessors.x)
            .attr('y', label.accessors.y)
            .attr('dx', label.accessors.dx)
            .attr('visibility', label.accessors.visibility);
        link
            .attr('d', link.accessors.path);
    }

    applyTransform(transform) {
        const { x, y, k } = transform;
        const { label, link } = this.elements;

        label.accessors.x = n => x + k * n.x;
        label.accessors.y = n => y + k * n.y;
        label.accessors.dx = (n) => {
            const r = 1.1 * this.style.nodeRadius(n);
            const dx = k * r + (k > 1 ? 1.5 * (1 - k) * r : 0);
            return Math.max(dx, 0);
        };
        label.accessors.visibility = n =>
            label.accessors.visible(k)(n) ? 'visible' : 'hidden'
        label.accessors.text = (n) => {
            const node = k < 0.15 && n.id === 1 && n.parent ? n.parent : n;
            return nodeName(node);
        };
        link.accessors.path = l =>
            link.accessors.visible(k)(l) ? this.linkRenderer(l) : null;

        this.update();
    }

    stop() {
        this.simulation.stop();
    }

    on(name, callback) {
        if (callback) {
            this.event.on(name, callback);
            return this;
        }
        return this.event.on(name);
    }
}