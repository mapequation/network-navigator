/**
 * Read a file with FileReader, invoking a callback for each file
 *
 * @param file The File object
 * @param cb Callback function to pass to FileReader#onload
 */
export function readFile(file, cb) {
    let reader = new FileReader();
    reader.onload = cb;
    reader.readAsText(file);
}

/**
 * Read a list of files with FileReader, invoking a callback for each file
 *
 * @param files The FileList object
 * @param cb Callback function to pass to FileReader#onload
 */
export function readFileList(files, cb) {
    for (let f of files) {
        readFile(f, cb);
    }
}
