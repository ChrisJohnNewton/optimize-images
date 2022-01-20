const dropArea = <HTMLDivElement>document.getElementById('drop-area'),
fileChooser = <HTMLInputElement>document.getElementById('file-chooser'),
gallery = <HTMLFormElement>document.getElementById('gallery'),
progressBarContainer = <HTMLDivElement>document.getElementById('progress-bar-container'),
progressBarLabel = <HTMLLabelElement>document.querySelector('label[for=progress-bar]'),
progressBar = <HTMLProgressElement>document.getElementById('progress-bar'),
imageName = <HTMLInputElement>document.getElementById('image-name'),
imageWidth = <HTMLInputElement>document.getElementById('image-width')!,
preserveNamesFieldset = <HTMLFieldSetElement>document.getElementById('preserve-name-fieldset'),
preserveWidthsFieldset = <HTMLFieldSetElement>document.getElementById('preserve-width-fieldset'),
imagePreserveNames = <NodeListOf<HTMLInputElement>>document.querySelectorAll('input[name=preserve-name]'),
imagePreserveWidths = <NodeListOf<HTMLInputElement>>document.querySelectorAll('input[name=preserve-width]'),
fileTypes = <NodeListOf<HTMLInputElement>>document.querySelectorAll('input[name="file-types"]'),
prepareImageButton = <HTMLButtonElement>document.getElementById('prepare-image-button'),
wasmImageWorker = new Worker('/optimize-images/imports/wasm-image-tools/wasm-image-worker.js'),
formDownload = <HTMLFormElement>document.querySelector('form[name=download]');
window.imageTypesArray = new Array();

navigator.serviceWorker.register("client-zip-service-worker.js", { type: "module" });
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

imagePreserveWidths.forEach(input => {
    input.addEventListener(
        'click',
        () => {
            if (imagePreserveWidths[0].checked) {
                preserveWidthsFieldset.style.height = "37px";
                preserveWidthsFieldset.style.removeProperty("justify-content");
                imageWidth.style.opacity = "0";
                imageWidth.style.visibility = "hidden";
            } else {
                preserveWidthsFieldset.style.height = "100px";
                preserveWidthsFieldset.style.justifyContent = "space-around";
                imageWidth.style.opacity = "1";
                imageWidth.style.visibility = "visible";
                imageWidth.placeholder = `Your image is currently ${window.originalImageWidth}px wide.`
                imageWidth.max = window.originalImageWidth.toString();
            }
        }
    )
});


imageWidth.addEventListener(
    "input",
    e => {
        if (parseInt((<HTMLInputElement>e.target).value) > parseInt((<HTMLInputElement>e.target).max)) {
            (<HTMLInputElement>e.target).value = (<HTMLInputElement>e.target).max;

        (<HTMLDivElement>imageWidth.parentNode).classList.add('tooltipOpaque');
        
        // Wait 1.5 seconds.
        setTimeout(()=>{
            // Remove the class that changes the opacity of the tooltip's pseudoelements.
            (<HTMLDivElement>imageWidth.parentNode).classList.remove('tooltipOpaque');
        }, 2500);
        }
    }
)

wasmImageWorker.onmessage = e => {
      
    progressBar.value += Math.round(100 / window.imageTotal);
    progressBar.textContent = `${progressBar.value}%`;
    progressBarLabel.textContent = `${progressBar.value}% complete`;
    
    const dataArray = e.data[0],
    width = e.data[1],
    height = e.data[2],
    lastImage = e.data[3];
    window.imageType = e.data[4];
    window.imageTypesArray.push(e.data[4]);

    const imageBlob = new Blob([dataArray]),
    imageBlobTyped = imageBlob.slice(0, imageBlob.size, `image/${window.imageType}`),
    imageBlobURL = URL.createObjectURL(imageBlobTyped);

    let formDownloadInput = document.createElement("input");
    formDownloadInput.type = "url";
    formDownloadInput.name = "url";
    formDownloadInput.value = imageBlobURL;
    formDownload.appendChild(formDownloadInput);

    if (lastImage) formDownload.zip.click();
};

function previewFile(file: File) {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
        
        window.originalImageType = file.type;
        window.originalImageName = (file.name).substring(0, (file.name).lastIndexOf('.'));

        if (gallery.style.display === "none") gallery.style.removeProperty("display");

        let img = document.createElement('img');
        img.src = <string>reader.result;
        img.id = "web-image";
        img.className = "br6 l2";
        img.dataset.fileName = file.name;
        img.onload = async () => {
            window.originalImageWidth = img.naturalWidth;
            window.originalImageHeight = img.naturalHeight;
        }

        if (gallery.children.length > 0) gallery.removeChild(gallery.firstChild!);
        
        gallery.prepend(img);

    };
};

function prepareImage() {
    
    progressBarContainer.style.removeProperty("display");

    const webImage = <HTMLImageElement>document.getElementById('web-image');
    
    let fileTypeList: String[] = new Array();

    for (let fileType of <any>fileTypes) {
        if (fileType.checked) fileTypeList.push(`wasm_${fileType.id}()`);
    };

    window.imageTotal = fileTypeList.length;

    if (imagePreserveWidths[1].checked && imageWidth.value !== "") window.encodedImageWidth = parseInt(imageWidth.value);
    else window.encodedImageWidth =  window.originalImageWidth;

    while (formDownload.url) formDownload.lastElementChild!.remove();

    fetch(webImage.src)
    .then(response => response.arrayBuffer())
    .then(buffer => {
        wasmImageWorker.postMessage([new Uint8ClampedArray(buffer), window.originalImageType, window.originalImageWidth, window.originalImageHeight, window.encodedImageWidth, fileTypeList]);

        progressBar.value = 5;
        progressBar.textContent = "5%";
        progressBarLabel.textContent = "5% complete";
    });
};