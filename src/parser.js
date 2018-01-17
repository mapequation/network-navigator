import Parsimmon from 'parsimmon';
import { unQuote } from './utils';

const P = Parsimmon;

/**
 * File format parser for tree files
 */
const TreeParser = P.createLanguage({
    commentLine: () => P.regex(/^#.*\n/)
        .desc('Comment line'),

    treePath: () => P.regex(/([0-9]+:)+[0-9]+/)
        .map(val => val.split(':').map(Number))
        .desc('Tree Path'),

    flow: () => P.regexp(/-?(0|[1-9][0-9]*)([.][0-9]+)?([eE][+-]?[0-9]+)?/)
        .map(Number)
        .desc('Flow'),

    name: () => P.regex(/"[^"]*"|\S+/)
        .map(unQuote)
        .desc('Name'),

    node: () => P.digits
        .map(Number)
        .desc('Node'),

    line: r => P.seq(
        r.treePath,
        P.whitespace.then(r.flow),
        P.whitespace.then(r.name),
        P.whitespace.then(r.node),
        P.whitespace.then(r.node).skip(P.oneOf('\n')),
    ),

    lines: r => r.commentLine.many().then(r.line.many()),
});

export default TreeParser;
