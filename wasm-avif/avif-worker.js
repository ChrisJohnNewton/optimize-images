self.importScripts('./wasm_avif.js');

const defaultOptions = {
  minQuantizer: 1,
  maxQuantizer: 2,
  minQuantizerAlpha: 1,
  maxQuantizerAlpha: 2,
  tileRowsLog2: 1,
  tileColsLog2: 2,
  speed: 10,
};

const fetchImage = async () => new Uint8Array(
  await fetch("https://chrisjohnnewton.github.io/images/chris-john-newton-raw.jpg")
        .then(response => response.arrayBuffer())
);

self.onmessage = e => {
  Promise.all([fetchImage(), wasm_avif()])
  .then(([buffer, encoder]) => {

    console.log(`buffer length is: ${buffer.length}`)
    console.log(buffer);

    const encoded = encoder.encode(
      buffer,
      100, // Width
      100, // Height
      3, // Channels
      defaultOptions,
      3, // Chroma
    );

    encoder.free();

    self.postMessage(new Uint8ClampedArray(encoded));

  // const avifModule = wasm_avif({
  //   onRuntimeInitialized() {
  //     const channels = 4; // 4 representing RGBA buffer in source array, 3 RGB
  //     const chroma = 3; // chroma subsampling: 1 for 4:4:4, 2 for 4:2:2, 3 for 4:2:0
  //     const result = avifModule.encode(
  //       fetchImage,
  //       800, // Width
  //       600, // Height
  //       channels,
  //       defaultOptions,
  //       chroma
  //     ); // encode image data and return a new Uint8Array
  //     avifModule.free(); // clean up memory after encoding is done
  //   }
  // }).then(result => self.postMessage(result))

  })
}