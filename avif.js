// import { wasm_avif } from './imports/wasm-avif/wasm_avif.js';
// import { defaultOptions } from './imports/wasm-avif/options.js';

const wasm_avif = new Worker('/optimize-images/imports/wasm-avif/avif-worker.js');

// const fetchImage = async () => new Uint8Array(
//   await fetch("http://localhost/ChrisJohnNewton.GitHub.io/images/chris-john-newton-1371.avif")
//         .then(res => res.arrayBuffer())
// );

const execute = document.getElementById('execute');

execute.addEventListener('click', () => {
  console.log("Start avifModule");

  wasm_avif.postMessage("Do work");

  console.log("Ending avifModule");

  // Initialize the WebAssembly Module
  // const avifModule = wasm_avif.postMessage("Do work")
  // .then(result=>{
  //   console.log(JSON.stringify(result));
  //   document.body.appendChild(result);
    
  //   console.log(`defaultOptions: ${defaultOptions}`)
  //   console.log(`fetchImage: ${fetchImage}`);
  //   console.log(`wasmAVIF: ${wasmAVIF}`);
  //   console.log("Done");
  // });
});

wasm_avif.onmessage = e => {
  console.log(e.data);

  // let newClampedArray = e.data;
  // console.log(`input data length = ${newClampedArray.length}`);
  // let imageWidth = 1371;
  // console.log(`image width = ${imageWidth}`);
  // console.log(`4 x width = ${4 * imageWidth}`);
  // console.log(`4 x width x height = ${4 * imageWidth * imageWidth}`);
  // let imageData = new ImageData(newClampedArray, 1371, 1371),
  // newCanvas = document.createElement("canvas");
  // newCanvas.getContext("2d").putImageData(imageData, 0, 0);
  
  const blob = new Blob([e.data])
  console.log(`blob is: ${blob.size}`);
  const newImage = new Image();
  newImage.width = 100;
  newImage.height = 100;
  newImage.src = URL.createObjectURL(blob);
  console.log(`newImage.src is: ${newImage.src}
  newImage.width is: ${newImage.width}
  newImage.height is: ${newImage.height}`);
  document.body.appendChild(newImage);


  
  // document.getElementById("myDownloadLink").appendChild(newImage);


  let canvas = document.createElement('canvas'),
  canvasContext = canvas.getContext('2d');
  canvas.width = 100;
  canvas.height = 100;
  canvasContext.drawImage(newImage, 0, 0, 100, 100);
  document.body.appendChild(canvas);
  
  let canvasDataURL = canvas.toDataURL(blob),
  downloadLink = document.createElement("a");
  
  downloadLink.download = "avifImage.avif";
  downloadLink.innerText = "AVIF download."
  downloadLink.href = canvasDataURL;
  downloadLink.dataset.downloadurl = `image/avif:${downloadLink.download}:${downloadLink.href}`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  // document.body.removeChild(downloadLink);

}

// let result;

// WebAssembly.instantiateStreaming(fetch("/optimize-images/imports/wasm-avif/wasm_avif.wasm"))
// .then(instantiatedObject => {
//   const exports = instantiatedObject.instance.exports;

//   const avifModule = exports.wasm_avif({
//     onRuntimeInitialized() {
//       console.log("Starting");
//       const channels = 4; // 4 representing RGBA buffer in source array, 3 RGB
//       const chroma = 3; // chroma subsampling: 1 for 4:4:4, 2 for 4:2:2, 3 for 4:2:0
//       result = avifModule.encode(
//         fetchImage,
//         800, // Width
//         600, // Height
//         channels,
//         defaultOptions,
//         chroma
//       ); // encode image data and return a new Uint8Array
//       avifModule.free(); // clean up memory after encoding is done
//     }
//   });
// })