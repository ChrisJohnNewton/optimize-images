"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const dropArea = document.getElementById('drop-area'), fileChooser = document.getElementById('file-chooser'), gallery = document.getElementById('gallery'), imageName = document.getElementById('image-name'), imageWidth = document.getElementById('image-width'), preserveNamesFieldset = document.getElementById('preserve-name-fieldset'), preserveWidthsFieldset = document.getElementById('preserve-width-fieldset'), imagePreserveNames = document.querySelectorAll('input[name=preserve-name]'), imagePreserveWidths = document.querySelectorAll('input[name=preserve-width]'), fileTypes = document.querySelectorAll('input[name="file-types"]'), prepareImageButton = document.getElementById('prepare-image-button'), wasmImageWorker = new Worker('/optimize-images/imports/wasm-image-tools/wasm-image-worker.js'), formDownload = document.querySelector('form[name=download]'), imageWidthObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (typeof mutation.addedNodes[0] === "object") {
            let previewImage = mutation.addedNodes[0];
            window.originalImageWidth = previewImage.naturalWidth;
            window.originalImageHeight = previewImage.naturalHeight;
        }
    });
});
imageWidthObserver.observe(gallery, { childList: true });
window.imageTypesArray = new Array();
navigator.serviceWorker.register("/ChrisJohnNewton.GitHub.io/client-zip-service-worker.js", {
    type: "module"
});
navigator.serviceWorker.oncontrollerchange = e => {
    if (navigator.serviceWorker.controller) {
        if (!imagePreserveNames[0].checked) {
            if (imageName.value.match(/\w+/g) !== null)
                navigator.serviceWorker.controller.postMessage([imageName.value.match(/\w+/g).join("-"), window.imageTypesArray]);
            else
                navigator.serviceWorker.controller.postMessage(["image", window.imageTypesArray]);
        }
        else {
            navigator.serviceWorker.controller.postMessage([window.originalImageName, window.imageTypesArray]);
        }
        window.imageTypesArray = new Array();
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
imagePreserveNames.forEach(input => {
    input.addEventListener('click', () => {
        if (imagePreserveNames[0].checked) {
            preserveNamesFieldset.style.height = "37px";
            preserveNamesFieldset.style.removeProperty("justify-content");
            imageName.style.opacity = "0";
            imageName.style.visibility = "hidden";
        }
        else {
            preserveNamesFieldset.style.height = "100px";
            preserveNamesFieldset.style.justifyContent = "space-around";
            imageName.style.opacity = "1";
            imageName.style.visibility = "visible";
        }
    });
});
imagePreserveWidths.forEach(input => {
    input.addEventListener('click', () => {
        if (imagePreserveWidths[0].checked) {
            preserveWidthsFieldset.style.height = "37px";
            preserveWidthsFieldset.style.removeProperty("justify-content");
            imageWidth.style.opacity = "0";
            imageWidth.style.visibility = "hidden";
        }
        else {
            preserveWidthsFieldset.style.height = "100px";
            preserveWidthsFieldset.style.justifyContent = "space-around";
            imageWidth.style.opacity = "1";
            imageWidth.style.visibility = "visible";
            imageWidth.placeholder = `Your image is currently ${window.originalImageWidth}px wide.`;
            imageWidth.max = window.originalImageWidth.toString();
        }
    });
});
imageWidth.addEventListener("input", e => {
    if (parseInt(e.target.value) > parseInt(e.target.max)) {
        e.target.value = e.target.max;
        imageWidth.parentNode.classList.add('tooltipOpaque');
        setTimeout(() => {
            imageWidth.parentNode.classList.remove('tooltipOpaque');
        }, 2500);
    }
});
wasmImageWorker.onmessage = e => {
    const dataArray = e.data[0], width = e.data[1], height = e.data[2], lastImage = e.data[3];
    window.imageType = e.data[4];
    window.imageTypesArray.push(e.data[4]);
    const imageBlob = new Blob([dataArray]), imageBlobTyped = imageBlob.slice(0, imageBlob.size, `image/${window.imageType}`), imageBlobURL = URL.createObjectURL(imageBlobTyped);
    let formDownloadInput = document.createElement("input");
    formDownloadInput.type = "url";
    formDownloadInput.name = "url";
    formDownloadInput.value = imageBlobURL;
    formDownload.appendChild(formDownloadInput);
    if (lastImage)
        formDownload.zip.click();
};
function previewFile(file) {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => __awaiter(this, void 0, void 0, function* () {
        window.originalImageType = file.type;
        window.originalImageName = (file.name).substring(0, (file.name).lastIndexOf('.'));
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
    });
}
;
function prepareImage() {
    const webImage = document.getElementById('web-image'), downloadBlobs = document.getElementsByName("url");
    let fileTypeList = new Array();
    for (let fileType of fileTypes) {
        if (fileType.checked)
            fileTypeList.push(`wasm_${fileType.id}()`);
    }
    ;
    if (imagePreserveWidths[1].checked && imageWidth.value !== "")
        window.encodedImageWidth = parseInt(imageWidth.value);
    else
        window.encodedImageWidth = window.originalImageWidth;
    while (formDownload.url)
        formDownload.lastElementChild.remove();
    fetch(webImage.src)
        .then(response => response.arrayBuffer())
        .then(buffer => wasmImageWorker.postMessage([new Uint8ClampedArray(buffer), window.originalImageType, window.originalImageWidth, window.originalImageHeight, window.encodedImageWidth, fileTypeList]));
}
;
