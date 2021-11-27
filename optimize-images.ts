const dropArea: HTMLElement = document.getElementById('drop-area'),
fileChooser: HTMLElement = document.getElementById('file-chooser'),
gallery: HTMLElement = document.getElementById('gallery'),
metaTitle: HTMLElement = document.getElementById('meta-title'),
metaAuthor: HTMLElement = document.getElementById('meta-author'),
metaCopyright: HTMLElement = document.getElementById('meta-copyright'),
imageWidths: NodeListOf<HTMLInputElement> = document.querySelectorAll('input[name="image-widths"]'),
fileTypes: NodeListOf<HTMLInputElement> = document.querySelectorAll('input[name="file-types"]'),
prepareImageButton: HTMLElement = document.getElementById('prepare-image-button'),
wasmImageWorker = new Worker('/optimize-images/imports/wasm-image-tools/wasm-image-worker.js');
// clientZipWorker = new Worker('/optimize-images/imports/client-zip/client-zip-worker.js');
// navigator.serviceWorker.register('/optimize-images/client-zip-worker.js', {
//     scope: '/optimize-images/'
// });

// When the dragged item is dragged over dropArea, making it the target for the drop event if the user drops it there.
dropArea.addEventListener('dragenter', handlerFunction, false);
// When the dragged item is dragged off of dropArea and onto another element, making it the target for the drop event instead.
dropArea.addEventListener('dragleave', handlerFunction, false);
// Every few hundred milliseconds, while the dragged item is over dropArea and is moving.
dropArea.addEventListener('dragover', handlerFunction, false);
// When the user releases their mouse button, dropping the dragged item onto dropArea.
dropArea.addEventListener('drop', handlerFunction, false);

// Prevent default browser behaviour and stop propagation.
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(
        eventName,
        e => {
            e.preventDefault();
            e.stopPropagation();
        },
        false
    )
});

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(
        eventName,
        () => dropArea.style.backgroundColor = "#fff6e7",
        false
    )
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(
        eventName,
        () => dropArea.style.backgroundColor = "#fff",
        false
    )
});

dropArea.addEventListener(
    'drop',
    e => {
        let file: File = e.dataTransfer.files[0];
        previewFile(file);
    },
    false
);

fileChooser.addEventListener(
    'change',
    e => {
        let file: File = (<HTMLInputElement>e.currentTarget).files[0];
        previewFile(file);
    },
    false
);

prepareImageButton.addEventListener(
    'click',
    () => prepareImage()
);

wasmImageWorker.onmessage = e => {
  
    const dataArray = e.data[0],
    width = e.data[1],
    height = e.data[2],
    imageType = e.data[3];

    const imageBlob = new Blob([dataArray]),
    imageDataURL = URL.createObjectURL(imageBlob),
    imageHTML = document.createElement('figure');
    imageHTML.classList.add('m0', 'g', 'jic', 'b1', 'br6');
    imageHTML.style.padding = "4px 4px 0 4px";

    imageHTML.innerHTML = `<img width=\"150\" src=\"${imageDataURL}\">
    <figcaption>${imageType}. ${imageBlob.size} bytes</figcaption>`;

    prepareImageButton.insertAdjacentElement('afterend', imageHTML);
};

function handlerFunction() {
    return true;
};

function previewFile(file) {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
        if (gallery.style.display === "none") gallery.style.removeProperty("display");
        let img = document.createElement('img')
        img.src = <string>reader.result;
        img.id = "web-image"
        img.className = "br6 l2";
        img.dataset.fileName = file.name;
        if (gallery.children.length > 0) gallery.removeChild(gallery.firstChild);
        gallery.prepend(img);
    };
};

function prepareImage() {
    const webImage = <HTMLImageElement>document.getElementById('web-image');

    let fileTypeList: String[] = new Array();
    for (let fileType of <any>fileTypes) {
        if (fileType.checked) fileTypeList.push(`wasm_${fileType.id}()`);
    }

    fetch(webImage.src)
    .then(response => response.arrayBuffer())
    .then(buffer => wasmImageWorker.postMessage([new Uint8ClampedArray(buffer), fileTypeList]));
};

// clientZipWorker.postMessage("Go!");

// clientZipWorker.onmessage = e => {
//     const link = document.createElement("a");
//     link.href = URL.createObjectURL(e.data);
//     link.download = "test.zip";
//     link.click();
//     link.remove();
// }