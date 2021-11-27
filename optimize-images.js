"use strict";
const dropArea = document.getElementById('drop-area'), fileChooser = document.getElementById('file-chooser'), gallery = document.getElementById('gallery'), metaTitle = document.getElementById('meta-title'), metaAuthor = document.getElementById('meta-author'), metaCopyright = document.getElementById('meta-copyright'), imageWidths = document.querySelectorAll('input[name="image-widths"]'), fileTypes = document.querySelectorAll('input[name="file-types"]'), prepareImageButton = document.getElementById('prepare-image-button'), wasmImageWorker = new Worker('/optimize-images/imports/wasm-image-tools/wasm-image-worker.js');
dropArea.addEventListener('dragenter', handlerFunction, false);
dropArea.addEventListener('dragleave', handlerFunction, false);
dropArea.addEventListener('dragover', handlerFunction, false);
dropArea.addEventListener('drop', handlerFunction, false);
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.style.backgroundColor = "#fff6e7", false);
});
['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.style.backgroundColor = "#fff", false);
});
dropArea.addEventListener('drop', e => {
    let file = e.dataTransfer.files[0];
    previewFile(file);
}, false);
fileChooser.addEventListener('change', e => {
    let file = e.currentTarget.files[0];
    previewFile(file);
}, false);
prepareImageButton.addEventListener('click', () => prepareImage());
wasmImageWorker.onmessage = e => {
    const dataArray = e.data[0], width = e.data[1], height = e.data[2], imageType = e.data[3];
    const imageBlob = new Blob([dataArray]), imageDataURL = URL.createObjectURL(imageBlob), imageHTML = document.createElement('figure');
    imageHTML.classList.add('m0', 'g', 'jic', 'b1', 'br6');
    imageHTML.style.padding = "4px 4px 0 4px";
    imageHTML.innerHTML = `<img width=\"150\" src=\"${imageDataURL}\">
    <figcaption>${imageType}. ${imageBlob.size} bytes</figcaption>`;
    prepareImageButton.insertAdjacentElement('afterend', imageHTML);
};
function handlerFunction() {
    return true;
}
;
function previewFile(file) {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
        if (gallery.style.display === "none")
            gallery.style.removeProperty("display");
        let img = document.createElement('img');
        img.src = reader.result;
        img.id = "web-image";
        img.className = "br6 l2";
        img.dataset.fileName = file.name;
        if (gallery.children.length > 0)
            gallery.removeChild(gallery.firstChild);
        gallery.prepend(img);
    };
}
;
function prepareImage() {
    const webImage = document.getElementById('web-image');
    let fileTypeList = new Array();
    for (let fileType of fileTypes) {
        if (fileType.checked)
            fileTypeList.push(`wasm_${fileType.id}()`);
    }
    fetch(webImage.src)
        .then(response => response.arrayBuffer())
        .then(buffer => wasmImageWorker.postMessage([new Uint8ClampedArray(buffer), fileTypeList]));
}
;
