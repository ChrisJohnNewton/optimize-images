// import DownZip from './imports/downzip';
// document.getElementById('myDownloadLink').addEventListener('click', () => {
//     async function downZipIt() {
//         // Setup downzip object
//         const downZip = new DownZip();
//         await downZip.register();
//         const downloadId = "aaaabbbb";
//         const zipFileName = "downzip-file";
//         const files = [
//             {
//                 name: 'picture1.jpg',
//                 downloadUrl: 'https://m.media-amazon.com/images/M/MV5BNDVkYjU0MzctMWRmZi00NTkxLTgwZWEtOWVhYjZlYjllYmU4XkEyXkFqcGdeQXVyNTA4NzY1MzY@._V1_.jpg',
//                 size: 65366    // In bytes
//             }, 
//             {
//                 name: 'picture2.jpg',
//                 downloadUrl: 'https://m.media-amazon.com/images/M/MV5BNDVkYjU0MzctMWRmZi00NTkxLTgwZWEtOWVhYjZlYjllYmU4XkEyXkFqcGdeQXVyNTA4NzY1MzY@._V1_.jpg',
//                 size: 65366    // In bytes
//             }
//         ]
//         const downloadUrl = await downZip.downzip(
//             downloadId,
//             zipFileName,
//             files
//         )
//         document.getElementById('myDownloadLink').setAttribute("href", downloadUrl);
//     }; downZipIt();
// });
// async function downZipIt() {
//     // Setup downzip object
//     const downZip = new DownZip();
//     await downZip.register();
//     const downloadId = "aaaabbbb";
//     const zipFileName = "downzip-file";
//     const files = [
//         {
//             name: 'picture1.jpg',
//             downloadUrl: 'https://m.media-amazon.com/images/M/MV5BNDVkYjU0MzctMWRmZi00NTkxLTgwZWEtOWVhYjZlYjllYmU4XkEyXkFqcGdeQXVyNTA4NzY1MzY@._V1_.jpg',
//             size: 65366    // In bytes
//         }, 
//         {
//             name: 'picture2.jpg',
//             downloadUrl: 'https://m.media-amazon.com/images/M/MV5BNDVkYjU0MzctMWRmZi00NTkxLTgwZWEtOWVhYjZlYjllYmU4XkEyXkFqcGdeQXVyNTA4NzY1MzY@._V1_.jpg',
//             size: 65366    // In bytes
//         }
//     ]
//     const downloadUrl = await downZip.downzip(
//         downloadId,
//         zipFileName,
//         files
//     )
//     document.getElementById('myDownloadLink').setAttribute("href", downloadUrl);
// };
// downZipIt();
const dropArea = document.getElementById('drop-area'), fileChooser = document.getElementById('file-chooser'), gallery = document.getElementById('gallery'), metaTitle = document.getElementById('meta-title'), metaAuthor = document.getElementById('meta-author'), metaCopyright = document.getElementById('meta-copyright'), imageWidths = document.querySelectorAll('input[name="image-widths"]'), fileTypes = document.querySelectorAll('input[name="file-types"]'), prepareImageButton = document.getElementById('prepare-image-button');
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
function handlerFunction() {
    return true;
}
;
function uploadFile(file) {
    let formData = new FormData();
    formData.append('image', file);
    // fetch('http://localhost/optimize-images/handle-image.min.js', {
    //     method: 'POST',
    //     body: formData
    // })
        // .then(() => { })
        // .catch(() => { });
}
;
function previewFile(file) {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = function () {
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
    document.querySelectorAll('canvas').forEach(canvas => document.body.removeChild(canvas));
    let img = document.getElementById('web-image'), imgName = document.getElementById('web-image').dataset.fileName, checkedImageWidths = new Array(), checkedFileTypes = new Array();
    imageWidths.forEach(node => {
        if (node.checked) {
            checkedImageWidths.push(+node.nextElementSibling.textContent.replace("px", ""));
        }
    });
    fileTypes.forEach(node => {
        if (node.checked) {
            checkedFileTypes.push(node.nextElementSibling.textContent);
        }
    });
    checkedImageWidths.forEach(width => {
        let canvas = document.createElement('canvas'), height = img.height / (img.width / width), canvasContext = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        canvasContext.drawImage(img, 0, 0, width, height);
        let canvasDataURL = canvas.toDataURL("image/png"), downloadLink = document.createElement("a");
        downloadLink.download = imgName;
        downloadLink.href = canvasDataURL;
        downloadLink.dataset.downloadurl = `image/png:${downloadLink.download}:${downloadLink.href}`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    });
}
;
