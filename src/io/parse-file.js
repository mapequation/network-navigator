/**
 * @file This file contains helper functions for parsing files
 * that are not related to a specific file format.
 *
 * @author Anton Holmgren
 */

/**
 * Parse file with Papa.parse using a default config object.
 *
 * @param {(File|string)} file The file passed to Papa.parse
 * @return {Promise}
 */
export default function parseFile(file, opts = {}) {
  const defaultOpts = {
    comments: "#",
    delimiter: " ",
    quoteChar: "\"",
    dynamicTyping: true,
    skipEmptyLines: true,
    worker: true,
    ...opts
  };

  return new Promise((complete, error) =>
    Papa.parse(file, Object.assign(defaultOpts, { complete, error }))); // eslint-disable-line no-undef
}
