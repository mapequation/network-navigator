import Parsimmon from 'parsimmon';
import { unQuote } from 'utils';

const P = Parsimmon;

function commentLine() {
    return P.regex(/^#.*\n/)
        .desc('Comment line');
}

function name() {
    return P.regex(/"[^"]*"|\S+/)
        .map(unQuote)
        .desc('Name');
}

function node() {
    return P.digits
        .map(Number)
        .desc('Node');
}

/**
 * File format parser for tree files
 */
export const TreeParser = P.createLanguage({
    commentLine,
    name,
    node,

    treePath: () => P.regex(/([0-9]+:)+[0-9]+/)
        .map(val => val.split(':').map(Number))
        .desc('Tree Path'),

    flow: () => P.regexp(/-?(0|[1-9][0-9]*)([.][0-9]+)?([eE][+-]?[0-9]+)?/)
        .map(Number)
        .desc('Flow'),

    line: r => P.seq(
        r.treePath,
        P.whitespace.then(r.flow),
        P.whitespace.then(r.name),
        P.whitespace.then(r.node),
        P.whitespace.then(r.node).skip(P.oneOf('\n')),
    ).desc('Data line'),

    lines: r => r.commentLine.many().then(r.line.many()),
});

export const StateNetParser = P.createLanguage({
    commentLine,
    node,
    name,

    sectionCount: () => P.regex(/(\s?[0-9]+)?\n/)
        .desc('Section count'),

    sectionHeader: r =>
        P.oneOf('*').then(P.optWhitespace)
            .then(P.letters.skip(r.sectionCount))
            .desc('Section header'),

    physicalNode: r => P.seq(
        r.node,
        P.whitespace.then(r.name).skip(P.oneOf('\n')),
    ),

    stateNode: r => P.seq(
        (r.node.skip(P.whitespace)).many(),
        r.node.skip(P.oneOf('\n')),
    ),

    nodeSection: r => P.seq(
        r.sectionHeader,
        r.commentLine.many(),
        P.alt(r.physicalNode.many(), r.stateNode.many()),
    ),

    lines: r => r.commentLine.many()
        .then(r.nodeSection.many()),
});
