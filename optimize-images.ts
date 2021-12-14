const dropArea = <HTMLDivElement>document.getElementById('drop-area')!,
fileChooser = <HTMLInputElement>document.getElementById('file-chooser')!,
gallery = <HTMLFormElement>document.getElementById('gallery')!,
imageName = <HTMLInputElement>document.getElementById('image-name')!,
preserveNamesFieldset = <HTMLFieldSetElement>document.getElementById('preserve-name-fieldset'),
imagePreserveNames = <NodeListOf<HTMLInputElement>>document.querySelectorAll('input[name=preserve-name]'),
imageWidths = <NodeListOf<HTMLInputElement>>document.querySelectorAll('input[name="image-widths"]'),
fileTypes = <NodeListOf<HTMLInputElement>>document.querySelectorAll('input[name="file-types"]'),
prepareImageButton = <HTMLButtonElement>document.getElementById('prepare-image-button')!,
wasmImageWorker = new Worker('/optimize-images/imports/wasm-image-tools/wasm-image-worker.js'),
formDownload = <HTMLFormElement>document.querySelector('form[name=download]')!;
window.imageTypesArray = new Array();

navigator.serviceWorker.register("/ChrisJohnNewton.GitHub.io/client-zip-service-worker.js", {
    type: "module"
});
navigator.serviceWorker.oncontrollerchange = e => {
    if (navigator.serviceWorker.controller) {
        if (!imagePreserveNames[0].checked) {
            if (imageName.value.match(/\w+/g) !== null)
                navigator.serviceWorker.controller.postMessage([imageName.value.match(/\w+/g)!.join("-"), window.imageTypesArray]);
            else
                navigator.serviceWorker.controller.postMessage(["image", window.imageTypesArray]);
        } else {
            navigator.serviceWorker.controller.postMessage([window.originalImageName, window.imageTypesArray]);
        }
        window.imageTypesArray = new Array();
    }
};

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
        let file: File = e.dataTransfer!.files[0];
        previewFile(file);
    },
    false
);

fileChooser.addEventListener(
    'change',
    e => {
        let file: File = (<HTMLInputElement>e.currentTarget).files![0];
        previewFile(file);
    },
    false
);

prepareImageButton.addEventListener(
    'click',
    () => prepareImage()
);

imagePreserveNames.forEach(input => {
    input.addEventListener(
        'click',
        () => {
            if (imagePreserveNames[0].checked) {
                preserveNamesFieldset.style.height = "37px";
                preserveNamesFieldset.style.removeProperty("justify-content");
                imageName.style.opacity = "0";
                imageName.style.visibility = "hidden";
            } else {
                preserveNamesFieldset.style.height = "100px";
                preserveNamesFieldset.style.justifyContent = "space-around";
                imageName.style.opacity = "1";
                imageName.style.visibility = "visible";
            }
        }
    )
});

wasmImageWorker.onmessage = e => {
      
    const dataArray = e.data[0],
    width = e.data[1],
    height = e.data[2],
    lastImage = e.data[3];
    window.imageType = e.data[4];
    window.imageTypesArray.push(e.data[4]);

    const imageBlob = new Blob([dataArray]),
    imageBlobTyped = imageBlob.slice(0, imageBlob.size, `image/${window.imageType}`);
    window.imageDataURL = URL.createObjectURL(imageBlobTyped);

    let formDownloadInput = document.createElement("input");
    formDownloadInput.type = "url";
    formDownloadInput.name = "url";
    formDownloadInput.value = window.imageDataURL;
    formDownload.appendChild(formDownloadInput);

    if (lastImage) {
        formDownload.zip.click();
        while (formDownload.url) formDownload.lastElementChild!.remove();
    }
};

function previewFile(file: File) {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
        
        window.originalImageType = file.type;
        window.originalImageName = (file.name).substring(0, (file.name).lastIndexOf('.'));

        if (gallery.style.display === "none") gallery.style.removeProperty("display");
        let img = document.createElement('img')
        img.src = <string>reader.result;
        img.id = "web-image"
        img.className = "br6 l2";
        img.dataset.fileName = file.name;
        if (gallery.children.length > 0) gallery.removeChild(gallery.firstChild!);
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
    .then(buffer => wasmImageWorker.postMessage([new Uint8ClampedArray(buffer), window.originalImageType, fileTypeList]));
};