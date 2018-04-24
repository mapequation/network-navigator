export default function (parent, { x, y }) {
    const spinner = parent.append('g')
        .attr('id', 'loading')
        .attr('transform', `translate(${x}, ${y}) rotate(-45)`)
        .append('path')
        .attr('d', 'M0-25A25 25 0 0 1 25 0h-5A20 20 0 0 0 0-20z')
        .style('animation', 'spinning 1.5s ease-in-out infinite')
        .style('fill', '#555');

    return {
        remove: () => spinner.remove(),
    };
}

