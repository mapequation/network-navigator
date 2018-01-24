import PromiseFileReader from 'promise-file-reader';

import { processFile, parseSections } from 'parser';
import render from 'render';
import data from 'data';

function handleFiles(event) {
    const files = Array.from(event.target.files);

    files.forEach((file) => {
        PromiseFileReader.readAsText(file)
            .then(processFile)
            .then(d => parseSections(d.data))
            .then(console.log)
            .catch(err => console.error(err));
    });
}

document.getElementById('files').addEventListener('change', handleFiles, false);

render(data);
