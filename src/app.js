import PromiseFileReader from 'promise-file-reader';
import log from 'utils';
import { TreeParser, StateNetParser } from 'parser';

function printFileList(files) {
    const output = [];
    files.forEach((f) => {
        output.push(`<li><strong>${encodeURIComponent(f.name)}</strong> (${f.type || 'n/a'}) - ${f.size} bytes</li>`);
    });
    document.getElementById('list').innerHTML = `<ul>${output.join('')}</ul>`;
}

function processFile(file) {
    const pre = document.createElement('pre');
    pre.innerHTML = file;
    document.getElementById('list').insertBefore(pre, null);

    log(TreeParser.lines.tryParse(file));
}

function handleFiles(event) {
    const files = Array.from(event.target.files);

    printFileList(files);

    files.forEach((file) => {
        PromiseFileReader.readAsText(file)
            .then(processFile)
            .catch(err => console.error(err));
    });
}

document.getElementById('files').addEventListener('change', handleFiles, false);
