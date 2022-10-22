/******************************
  Get variable references for elements that exist already to the client
*******************************/
const dropArea = <HTMLDivElement>document.getElementById("drop-area"),
  fileChooser = <HTMLInputElement>document.getElementById("file-chooser"),
  gallery = <HTMLFormElement>document.getElementById("gallery"),
  progressBarContainer = <HTMLDivElement>(
    document.getElementById("progress-bar-container")
  ),
  progressBarLabel = <HTMLLabelElement>(
    document.querySelector("label[for=progress-bar]")
  ),
  progressBar = <HTMLProgressElement>document.getElementById("progress-bar"),
  imageContainer = <HTMLDivElement>document.getElementById("image-container"),
  settingsContainer = <HTMLDivElement>(
    document.getElementById("settings-container")
  ),
  imageName = <HTMLInputElement>document.getElementById("image-name"),
  imageWidth = <HTMLInputElement>document.getElementById("image-width")!,
  preserveNameFieldset = <HTMLFieldSetElement>(
    document.getElementById("preserve-name-fieldset")
  ),
  preserveWidthFieldset = <HTMLFieldSetElement>(
    document.getElementById("preserve-width-fieldset")
  ),
  imagePreserveName = <HTMLInputElement>(
    document.getElementById("preserve-name")
  ),
  imagePreserveWidth = <HTMLInputElement>(
    document.getElementById("preserve-width")
  ),
  fileTypes = <NodeListOf<HTMLInputElement>>(
    document.querySelectorAll('input[name="file-types"]')
  ),
  imageQuality = <HTMLInputElement>document.getElementById("quality"),
  imageQualityNumber = <HTMLSpanElement>(
    document.getElementById("quality-number")
  ),
  downloadButton = <HTMLButtonElement>(
    document.getElementById("download-button")
  ),
  wasmImageWorker = new Worker("wasm-image-worker.js");
// formDownload = <HTMLFormElement>document.querySelector("form[name=download]");
window.imageTypesArray = new Array();
window.hasImageBeenPrepared = true;
let workerMessageToSend;

/******************************
  Register and configure the service worker
*******************************/
navigator.serviceWorker.register("client-zip-service-worker.js", {
  // The loaded service worker is in an ES module and the import statement is available on worker contexts. Ref: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#type
  type: "module",
});

// The controllerchange event of the ServiceWorkerContainer interface fires when the document's associated ServiceWorkerRegistration acquires a new active worker. Ref: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/controllerchange_event
navigator.serviceWorker.addEventListener("controllerchange", (event) => {
  // Do a one-off check to see if a service worker's in control.
  if (navigator.serviceWorker.controller) {
    if (imagePreserveName.checked) {
      if (imageName.value.match(/\w+/g) !== null) {
        workerMessageToSend = [
          imageName.value.match(/\w+/g)!.join("-"),
          window.imageTypesArray,
        ];
      } else {
        workerMessageToSend = ["image", window.imageTypesArray];
      }
    } else {
      workerMessageToSend = [window.originalImageName, window.imageTypesArray];
    }
    navigator.serviceWorker.controller.postMessage(workerMessageToSend);
    // Reset the imageTypesArray in case the user wants to optimize a second image later.
    window.imageTypesArray = new Array();
  }
});

/******************************
  Configure the file drop area
*******************************/
["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(
    eventName,
    (event) => {
      // Prevent default browser behaviour and stop propagation.
      event.preventDefault();
      event.stopPropagation();
    },
    false
  );
});
["dragenter", "dragover"].forEach((eventName) => {
  dropArea.addEventListener(
    eventName,
    // Change the background colour of the drop area when an image is hovered over it.
    () => (dropArea.style.backgroundColor = "rgb(var(--colour-tertiary))"),
    false
  );
});
["dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(
    eventName,
    // Reset the background colour of the drop area when an image is no longer hovering over it.
    () => (dropArea.style.backgroundColor = "#fff"),
    false
  );
});
dropArea.addEventListener(
  "drop",
  (event) => {
    // Get a reference to (only) the first image hovered over the drop area and preview it.
    let file: File = event.dataTransfer!.files[0];
    generateImage(file);
  },
  false
);

/******************************
  Configure the file chooser
*******************************/
fileChooser.addEventListener(
  "change",
  (event) => {
    // Get a reference to (only) the first image chosen from the file dialog box and preview it.
    let file: File = (<HTMLInputElement>event.currentTarget).files![0];
    generateImage(file);
  },
  false
);

/******************************
  Toggle on/off the image preserve name/width input fields
*******************************/
imagePreserveName.addEventListener("click", (event) =>
  toggleField(event, imageName, preserveNameFieldset)
);
imagePreserveWidth.addEventListener("click", (event) =>
  toggleField(event, imageWidth, preserveWidthFieldset)
);

/******************************
  Show the image width's tooltip if the user inputs a width exceeding the image's original width
*******************************/
imageWidth.addEventListener("input", (event) => {
  if (
    parseInt((<HTMLInputElement>event.target).value) >
    parseInt((<HTMLInputElement>event.target).max)
  ) {
    (<HTMLInputElement>event.target).value = (<HTMLInputElement>(
      event.target
    )).max;

    (<HTMLDivElement>imageWidth.parentNode).classList.add("tooltipOpaque");

    // Linger for 1.5 seconds.
    setTimeout(() => {
      // Remove the class that changes the opacity of the tooltip's pseudo elements.
      (<HTMLDivElement>imageWidth.parentNode).classList.remove("tooltipOpaque");
    }, 2500);
  }
});

/******************************
  Prepare the new optimized image on image width changes
*******************************/
imageWidth.addEventListener("change", prepareImage);

/******************************
  Display the user's selected image quality value
  and prepare the new optimized image to show the user
*******************************/
imageQuality.addEventListener("input", () => {
  imageQualityNumber.textContent = imageQuality.value;
});
imageQuality.addEventListener("change", prepareImage);

/******************************
  Prepare the new optimized image on file type changes
*******************************/
fileTypes.forEach((fileType) =>
  fileType.addEventListener("change", prepareImage)
);

/******************************
  Download the optimized image
*******************************/
downloadButton.addEventListener("click", downloadImage);

/******************************
  Ran when the worker posts a message
*******************************/
wasmImageWorker.addEventListener("message", (event) => {
  // Update the progress bar
  progressBar.value += Math.round(100 / window.imageTotal);
  progressBar.textContent = `${progressBar.value}%`;
  progressBarLabel.textContent = `${progressBar.value}% loaded`;

  // Retrieve the data and image properties
  const dataArray = event.data[0],
    width = event.data[1],
    height = event.data[2],
    lastImage = event.data[3];
  window.imageType = event.data[4];
  window.imageTypesArray.push(event.data[4]);

  // Turn the data array into a blob
  const imageBlob = new Blob([dataArray]),
    // Prepend the MIME type of the image
    imageBlobTyped = imageBlob.slice(
      0,
      imageBlob.size,
      `image/${window.imageType}`
    ),
    // Create a blob URL
    imageBlobURL = URL.createObjectURL(imageBlobTyped);

  // Create the image and preview it
  let optimizedImage = document.createElement("img");
  optimizedImage.src = imageBlobURL;
  optimizedImage.id = "optimized-image";
  optimizedImage.title = "Optimized image";
  optimizedImage.classList.add("undraggable");
  optimizedImage.ondragstart = () => false;
  optimizedImage.style.position = "absolute";
  optimizedImage.style.clipPath = "inset(100% 0 0 0)";
  optimizedImage.style.top = "0";
  optimizedImage.style.left = "0";
  optimizedImage.style.width = "100%";
  optimizedImage.style.height = "100%";

  const doesOptimizedImageExist = document.getElementById("optimized-image");
  if (doesOptimizedImageExist)
    document.getElementById("optimized-image")!.remove();

  const currentScrubberContainer =
      document.getElementById("scrubber-container")!,
    currentWebImage = document.getElementById("web-image")!;
  currentScrubberContainer.insertBefore(optimizedImage, currentWebImage);

  window.hasImageBeenPrepared = true;
  settingsContainer.style.removeProperty("opacity");
  settingsContainer.style.removeProperty("pointer-events");
});

/******************************
  Download the image
*******************************/
function downloadImage() {
  const downloadLink = document.createElement("a");
  const currentOptimizedImage = document.getElementById(
    "optimized-image"
  )! as HTMLImageElement;
  downloadLink.href = currentOptimizedImage!.src;
  downloadLink.download = window.originalImageName || "image";
  downloadLink.style.opacity = "0";
  downloadLink.style.visibility = "hidden";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
}

/******************************
  Toggle the preserve name/width fields via this function
*******************************/
function toggleField(
  event: Event,
  input: HTMLInputElement,
  fieldset: HTMLFieldSetElement
) {
  const checkbox = event.target as HTMLInputElement;
  if (!checkbox.checked) {
    fieldset.style.removeProperty("justify-content");
    input.style.opacity = "0";
    input.style.visibility = "hidden";
    input.style.removeProperty("margin-top");
    input.style.removeProperty("margin-bottom");
  } else {
    fieldset.style.justifyContent = "space-around";
    input.style.opacity = "1";
    input.style.visibility = "visible";
    input.style.marginTop = "1rem";
    input.style.marginBottom = "1.5rem";
    if (input.id === "image-width")
      input.placeholder = `Your image is ${window.originalImageWidth}px wide.`;
    input.max = window.originalImageWidth.toString();
  }
}

function generateImage(file: File) {
  let reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = async () => {
    window.originalImageType = file.type;
    window.originalImageName = file.name.substring(
      0,
      file.name.lastIndexOf(".")
    );

    if (gallery.classList.contains("hidden")) {
      gallery.classList.remove("hidden");
    }

    let scrubberContainer = document.createElement("div");
    scrubberContainer.id = "scrubber-container";
    scrubberContainer.classList.add("scrubberContainer");
    [
      "mousedown",
      "mouseenter",
      "mouseover",
      "mousemove",
      "mouseleave",
      "pointerdown",
      "pointerenter",
      "pointerover",
      "pointermove",
      "pointerleave",
    ].forEach((eventName) => {
      scrubberContainer.addEventListener(
        eventName,
        (event) => moveScrubber(event as MouseEvent),
        false
      );
    });

    let img = document.createElement("img");
    img.src = <string>reader.result;
    img.id = "web-image";
    img.title = "Unoptimized image";
    img.classList.add("undraggable");
    img.ondragstart = () => false;
    img.dataset.fileName = file.name;
    img.onload = async () => {
      window.originalImageWidth = img.naturalWidth;
      window.originalImageHeight = img.naturalHeight;
      prepareImage();
    };

    let imgTopTag = document.createElement("span");
    imgTopTag.classList.add("imageTag");
    imgTopTag.style.top = "0";
    imgTopTag.textContent = "Original";

    let imgBottomTag = document.createElement("span");
    imgBottomTag.classList.add("imageTag");
    imgBottomTag.style.bottom = "0";
    imgBottomTag.textContent = "Compressed";

    let scrubber = document.createElement("div");
    scrubber.id = "scrubber";
    scrubber.classList.add("scrubber");

    let scrubberLine = document.createElement("div");
    scrubberLine.classList.add("scrubberLine");

    let scrubberCircle = document.createElement("div");
    scrubberCircle.classList.add("scrubberCircle");
    scrubberCircle.innerHTML = `<svg width="8" viewBox="0 0 10 16.75"><path fill="#fff" d="M9.84 5.79A.75.75 0 0 1 9.25 7H.75a.75.75 0 0 1-.6-1.21L4.43.29a.75.75 0 0 1 1.18 0l4.24 5.5Zm0 5.17a.75.75 0 0 0-.59-1.21H.75a.75.75 0 0 0-.6 1.21l4.27 5.5a.75.75 0 0 0 1.18 0l4.24-5.5z"/></svg>`;

    // Remove any other existing scrubber containers
    if (document.getElementById("scrubber-container"))
      document.getElementById("scrubber-container")!.remove();

    scrubberLine.prepend(scrubberCircle);
    scrubber.prepend(scrubberLine);
    scrubberContainer.prepend(imgTopTag, img, scrubber, imgBottomTag);
    imageContainer.prepend(scrubberContainer);
    gallery.prepend(imageContainer, settingsContainer);
  };
}

function moveScrubber(event: MouseEvent) {
  const mouseYPosition = event.clientY;
  const scrubber = document.getElementById("scrubber")!;
  const scrubberCurrentTransformValue = parseInt(
    window
      .getComputedStyle(scrubber)
      .getPropertyValue("transform")
      .split(", ")[5]
  );
  const scrubberHeight = scrubber.clientHeight;
  const scrubberYPosition = scrubber.getBoundingClientRect().y;

  const scrubberContainer = document.getElementById("scrubber-container")!;
  const scrubberContainerRect = scrubberContainer.getBoundingClientRect();
  const scrubberContainerTopPosition = scrubberContainerRect.top;
  const scrubberContainerBottomPosition = scrubberContainerRect.bottom;

  const calculation =
    scrubberCurrentTransformValue +
    (mouseYPosition - scrubberYPosition) -
    scrubberHeight / 2;

  let currentOptimizedImage;
  if (
    mouseYPosition >= scrubberContainerTopPosition &&
    mouseYPosition <= scrubberContainerBottomPosition
  ) {
    currentOptimizedImage =
      (document.getElementById("optimized-image") as HTMLImageElement) || false;
    if (currentOptimizedImage) {
      currentOptimizedImage.style.setProperty(
        "clipPath",
        `inset(calc(100% - ${
          -calculation - scrubber.clientHeight / 2
        }px) 0 0 0)`
      );
      currentOptimizedImage.style.setProperty(
        "-webkit-clip-path",
        `inset(calc(100% - ${
          -calculation - scrubber.clientHeight / 2
        }px) 0 0 0)`
      );
    }

    scrubber.style.transform = `translateY(${calculation}px)`;
  }
}

function prepareImage() {
  if (window.hasImageBeenPrepared) {
    window.hasImageBeenPrepared = false;
    settingsContainer.style.opacity = "0.5";
    settingsContainer.style.pointerEvents = "none";

    progressBarContainer.classList.remove("hidden");

    const webImage = <HTMLImageElement>document.getElementById("web-image");
    const imageWidth = <HTMLInputElement>(
      document.getElementById("image-width")!
    );

    let fileTypeList: String[] = new Array();

    for (let fileType of <any>fileTypes) {
      if (fileType.checked) fileTypeList.push(`wasm_${fileType.id}()`);
    }

    window.imageTotal = fileTypeList.length;

    if (imagePreserveWidth.checked && imageWidth.value !== "")
      window.encodedImageWidth = parseInt(imageWidth.value);
    else window.encodedImageWidth = window.originalImageWidth;

    // while (formDownload.url) formDownload.lastElementChild!.remove();

    fetch(webImage.src)
      .then((response) => response.arrayBuffer())
      .then((buffer) => {
        wasmImageWorker.postMessage([
          new Uint8ClampedArray(buffer),
          window.originalImageType,
          window.originalImageWidth,
          window.originalImageHeight,
          window.encodedImageWidth,
          fileTypeList,
          parseInt(document.getElementById("quality-number")!.textContent!),
        ]);

        progressBar.value = 5;
        progressBar.textContent = "5%";
        progressBarLabel.textContent = "5% loaded";
      });
  }
}
