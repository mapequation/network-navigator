import * as d3 from 'd3';
import { clickHandler, doubleClickHandler } from 'click-handler';
import makeDragHandler from 'drag-handler';
import { makeLinkLod, makeNodeLod } from 'render-style';
import { traverseDepthFirst } from 'network';

const ellipsis = (text, len = 25) => (text.length > len ? `${text.substr(0, len - 3)}...` : text);
const capitalizeWord = word => word && word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
const capitalize = str => str.split(' ').map(capitalizeWord).join(' ');
const nodeName = node => capitalize(ellipsis(node.name || node.largest.map(childNode => childNode.name).join(', ')))
const numberOfHits = n =>
    +n.marked || Array.from(traverseDepthFirst(n)).filter(child => child.marked).length;


export default function NetworkLayout(linkRenderer, style, parentElement, labelsElement, simulation) {
    const event = d3.dispatch('click', 'dblclick', 'mouseover', 'mouseout');

    const elements = {
        parent: parentElement,
        labels: labelsElement,
    };

    let nodes = [];
    let links = [];

    const onDrag = makeDragHandler(simulation);

    function init(network) {
        nodes = network.nodes.filter(node => node.shouldRender);
        links = network.links.filter(link => link.shouldRender).reverse();

        createElements();

        simulation.init({ nodes, links });
        simulation.on('tick', update);
    }

    function createElements() {
        const { parent, labels } = elements;

        parent.selectAll('*').remove();
        labels.selectAll('*').remove();

        elements.link = parent.append('g')
            .attr('class', 'links')
            .selectAll('.link')
            .data(links)
            .enter()
            .append('path')
            .attr('class', 'link')
            .style('fill', style.linkFillColor);

        elements.link.accessors = {
            path: linkRenderer,
            lod: makeLinkLod(links),
        };

        elements.node = parent.append('g')
            .attr('class', 'nodes')
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('id', n => n.path.toId())
            .on('click', clickHandler(function (n) { event.call('click', this, n) }))
            .on('dblclick', doubleClickHandler(function (n) { event.call('dblclick', this, n) }))
            .on('mouseover', function (n) { event.call('mouseover', this, n) })
            .on('mouseout', function (n) { event.call('mouseout', this, n) })
            .call(onDrag);

        elements.circle = elements.node.append('circle')
            .attr('r', style.nodeRadius)
            .style('fill', style.nodeFillColor)
            .style('stroke', style.nodeBorderColor)
            .style('stroke-width', style.nodeBorderWidth);

        elements.searchMark = elements.node.append('circle')
            .attr('r', n => style.searchMarkRadius(numberOfHits(n)))
            .style('fill', '#F48074');

        elements.label = labels.selectAll('.label')
            .data(nodes)
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
            dx: n => 1.1 * style.nodeRadius(n),
            lod: makeNodeLod(nodes),
            visibility: n => 'visible',
            text: nodeName,
        };
    }

    function update() {
        const { circle, searchMark, label, link } = elements;

        circle
            .attr('cx', n => n.x)
            .attr('cy', n => n.y);
        searchMark
            .attr('r', n => style.searchMarkRadius(numberOfHits(n)))
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

    function applyTransform(transform) {
        const { x, y, k } = transform;
        const { label, link } = elements;

        label.accessors.x = n => x + k * n.x;
        label.accessors.y = n => y + k * n.y;
        label.accessors.dx = (n) => {
            const r = 1.1 * style.nodeRadius(n);
            const dx = k * r + (k > 1 ? 1.5 * (1 - k) * r : 0);
            return Math.max(dx, 0);
        };
        label.accessors.visibility = n =>
            label.accessors.lod(k)(n) ? 'visible' : 'hidden'
        label.accessors.text = (n) => {
            const node = k < 0.15 && n.id === 1 && n.parent ? n.parent : n;
            return nodeName(node);
        };
        link.accessors.path = l =>
            link.accessors.lod(k)(l) ? linkRenderer(l) : null;

        update();
    }

    return {
        init,
        update,
        applyTransform,
        on: (name, callback) => callback ? event.on(name, callback) : event.on(name),
    };
}