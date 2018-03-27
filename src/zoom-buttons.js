import { select } from 'd3';

export default function(parent, position) {
    const zoomButtons = parent.append('g')
        .attr('class', 'zoomButtons')
        .attr('transform', `translate(${position.join(',')})`);

    const color = {
        fill: '#eee',
        hover: '#ddd',
        stroke: '#999',
        sign: '#666',
    };

    const plusButton = zoomButtons.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 24)
        .attr('height', 24)
        .attr('rx', 3)
        .attr('ry', 3)
        .style('fill', color.fill)
        .style('stroke', color.stroke)
        .style('stroke-width', '1px')
        .on('mouseover', function() {
            select(this).style('fill', color.hover);
        })
        .on('mouseout', function() {
            select(this).style('fill', color.fill);
        });

    // plus sign
    zoomButtons.append('rect')
        .attr('x', 11)
        .attr('y', 6)
        .attr('width', 2)
        .attr('height', 12)
        .attr('rx', 1)
        .attr('ry', 1)
        .style('pointer-events', 'none')
        .style('fill', color.sign);

    zoomButtons.append('rect')
        .attr('x', 6)
        .attr('y', 11)
        .attr('width', 12)
        .attr('height', 2)
        .attr('rx', 1)
        .attr('ry', 1)
        .style('pointer-events', 'none')
        .style('fill', color.sign);

    const minusButton = zoomButtons.append('rect')
        .attr('x', 0)
        .attr('y', 30)
        .attr('width', 24)
        .attr('height', 24)
        .attr('rx', 3)
        .attr('ry', 3)
        .style('fill', color.fill)
        .style('stroke', color.stroke)
        .style('stroke-width', '1px')
        .on('mouseover', function() {
            select(this).style('fill', color.hover);
        })
        .on('mouseout', function() {
            select(this).style('fill', color.fill);
        });

    // minus sign
    zoomButtons.append('rect')
        .attr('x', 6)
        .attr('y', 30 + 11)
        .attr('width', 12)
        .attr('height', 2)
        .attr('rx', 1)
        .attr('ry', 1)
        .style('pointer-events', 'none')
        .style('fill', color.sign);

    let buttons;

    return buttons = {
        onPlusClick: (callback) => (plusButton.on('click', callback), buttons),
        onMinusClick: (callback) => (minusButton.on('click', callback), buttons),
    };
}

