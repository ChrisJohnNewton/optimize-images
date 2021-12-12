"use strict";
const dropArea = document.getElementById('drop-area'), fileChooser = document.getElementById('file-chooser'), gallery = document.getElementById('gallery'), imageName = document.getElementById('image-name'), imagePreserveName = document.querySelector('input[name=preserve-name]'), imageWidths = document.querySelectorAll('input[name="image-widths"]'), fileTypes = document.querySelectorAll('input[name="file-types"]'), prepareImageButton = document.getElementById('prepare-image-button'), wasmImageWorker = new Worker('/optimize-images/imports/wasm-image-tools/wasm-image-worker.js'), formDownload = document.querySelector('form[name=download]');
window.imageTypesArray = new Array();
navigator.serviceWorker.register("/client-zip-service-worker.js", {
    type: "module"
});
navigator.serviceWorker.oncontrollerchange = e => {
    if (navigator.serviceWorker.controller) {
        if (!imagePreserveName.checked) {
            if (imageName.value.match(/\w+/g) !== null)
                navigator.serviceWorker.controller.postMessage([imageName.value.match(/\w+/g).join("-"), window.imageTypesArray]);
            else
                navigator.serviceWorker.controller.postMessage(["image", window.imageTypesArray]);
        }
        else {
            navigator.serviceWorker.controller.postMessage([".", window.imageTypesArray]);
        }
    }
};
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
    const dataArray = e.data[0], width = e.data[1], height = e.data[2], lastImage = e.data[3];
    window.imageType = e.data[4];
    window.imageTypesArray.push(e.data[4]);
    const imageBlob = new Blob([dataArray]), imageBlobTyped = imageBlob.slice(0, imageBlob.size, `image/${window.imageType}`);
    window.imageDataURL = URL.createObjectURL(imageBlobTyped);
    let formDownloadInput = document.createElement("input");
    formDownloadInput.type = "url";
    formDownloadInput.name = "url";
    formDownloadInput.value = window.imageDataURL;
    formDownload.appendChild(formDownloadInput);
    if (lastImage)
        formDownload.zip.click();
    while (formDownload.url)
        formDownload.lastElementChild.remove();
};
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
