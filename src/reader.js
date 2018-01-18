/**
 * Get file extension, returns undefined if there is no extension
 * (from https://stackoverflow.com/a/680982)
 *
 * @param file
 * @returns {string | undefined}
 */
function getFileExt(file) {
    let fileName = file;

    if ('name' in file) {
        fileName = file.name;
    }

    const re = /(?:\.([^.]+))?$/;
    return re.exec(fileName)[1];
}

/**
 * Is File a tree-file?
 * @param file
 * @returns {boolean}
 */
export function isTreeFile(file) {
    return getFileExt(file) === 'tree';
}

/**
 * is File a net-file?
 * @param file
 * @returns {boolean}
 */
export function isNetFile(file) {
    return getFileExt(file) === 'net';
}
