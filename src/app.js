import log from './utils';
import TreeParser from './parser';
import { readFileAsText } from './reader';

function printFileList(files) {
    const output = [];
    files.forEach((f) => {
        output.push(`<li><strong>${encodeURIComponent(f.name)}</strong> (${f.type || 'n/a'}) - ${f.size} bytes</li>`);
    });
    document.getElementById('list').innerHTML = `<ul>${output.join('')}</ul>`;
}

function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    log(files);

    printFileList(files);

    files.forEach((f) => {
        readFileAsText(f, (e) => {
            const pre = document.createElement('pre');
            pre.innerHTML = e.target.result;
            document.getElementById('list').insertBefore(pre, null);

            log(TreeParser.lines.tryParse(e.target.result));
        });
    });
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);
