/**
 * @file This file contains helper functions for parsing files
 * that are not related to a specific file format.
 *
 * @author Anton Eriksson
 */

/**
 * Parse file with Papa.parse using a default config object.
 *
 * @param {(File|string)} file The file passed to Papa.parse
 * @return {Promise}
 */
export default function parseFile(file) {
  const opts = {
    comments: "#",
    delimiter: " ",
    quoteChar: "\"",
    dynamicTyping: true,
    skipEmptyLines: true,
    worker: true
  };

  return new Promise((complete, error) =>
    Papa.parse(file, Object.assign(opts, { complete, error }))); // eslint-disable-line no-undef
}
