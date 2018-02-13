/**
 * @file This file contains helper functions for parsing files
 * that are not related to a specific file format.
 *
 * @author Anton Eriksson
 */


/**
 * Promise wrapper for Papa.parse
 *
 * @param {(File|string)} file The file passed to Papa.parse
 * @param {Object} opts The config object passed to Papa.parse
 * @returns {Promise}
 */
Papa.parsePromise = function (file, opts) {
    return new Promise((complete, error) =>
        Papa.parse(file, Object.assign(opts, { complete, error })));
};

/**
 * Parse file with Papa.parsePromise using a default config object.
 *
 * @param {(File|string)} file The file passed to Papa.parsePromise
 * @return {Promise}
 */
export default function parseFile(file) {
    const defaultOpts = {
        comments: '#',
        delimiter: ' ',
        quoteChar: '"',
        dynamicTyping: true,
        skipEmptyLines: true,
        worker: true,
    };

    return Papa.parsePromise(file, defaultOpts);
}
