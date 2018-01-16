
//let d3 = require('d3');
//let networkRendering = require('network-rendering');
import {l} from './utils';
import {transformTreeData, readString} from './parser';
import {readFileList} from "./reader";

function printFileList(files) {
    let output = [];
    for (let f of files) {
        output.push('<li><strong>', encodeURIComponent(f.name), '</strong> (', f.type || 'n/a', ') - ',
            f.size, ' bytes', '</li>');
    }
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
}

function readerOnLoad(event) {
    let pre = document.createElement('pre');
    pre.innerHTML = event.target.result;
    document.getElementById('list').insertBefore(pre, null);

    l(transformTreeData(readString(event.target.result)));
}


function handleFileSelect(event) {
    // files is a FileList of File objects
    let files = event.target.files;

    printFileList(files);
    readFileList(files, readerOnLoad);
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);
