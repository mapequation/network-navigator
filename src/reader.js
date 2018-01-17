/**
 * Construct a FileReader and set #onload to callback cb
 * @param cb The onload callback
 * @returns {FileReader}
 */
export function fileReaderWithCallback(cb) {
    const reader = new FileReader();
    reader.onload = cb;
    return reader;
}

/**
 * Read a file as text with FileReader, invoking a callback for each file
 *
 * @param file The File object
 * @param cb Callback function to pass to FileReader#onload
 */
export function readFileAsText(file, cb) {
    const reader = fileReaderWithCallback(cb);
    reader.readAsText(file);
}

/**
 * Read a list of files with FileReader, invoking a callback for each file
 *
 * @param files The FileList object
 * @param cb Callback function to pass to FileReader#onload
 */
export function readFileList(files, cb) {
    files.forEach(f => readFileAsText(f, cb));
}

/**
 * Get file extension, returns undefined if there is no extension
 *
 * (from https://stackoverflow.com/a/680982)
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
