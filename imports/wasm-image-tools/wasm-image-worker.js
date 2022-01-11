self.importScripts('./wasm_image_loader.min.js', './wasm_avif.min.js', './wasm_webp.min.js', './wasm_mozjpeg.min.js');

self.onmessage = e => {
  const buffer = e.data[0],
  originalImageType = e.data[1],
  originalImageWidth = e.data[2],
  originalImageHeight = e.data[3],
  encodedImageWidth = e.data[4],
  encodedImageHeight = originalImageHeight * (encodedImageWidth / originalImageWidth),
  fileTypeList = new Array();

  for (fileType of e.data[5]) {
    fileTypeList.push(eval(fileType))
  }

  if (originalImageType === "image/jpeg" || originalImageType === "image/jpg") {
    self.channels = 4;
    self.colorSpace = 12;
  } else {
    self.channels = 3;
    self.colorSpace = 6;
  }
  
  Promise.all([wasm_image_loader(), ...fileTypeList])
  .then(resultsArray => {

    const decoder = resultsArray[0],
    encoderArray = resultsArray.slice(1);
    
    let decoded = decoder.decode(buffer, buffer.length, self.channels);

    if (encodedImageWidth < originalImageWidth) decoded = decoder.resize(decoded, originalImageWidth, originalImageHeight, self.channels, encodedImageWidth, encodedImageHeight);

    encoderArray.forEach((encoder, key, encoderArray) =>
      {

        if (encoder.hasOwnProperty("AVIF_PIXEL_FORMAT")) {

          const encoded =
            new Uint8ClampedArray(
              encoder.encode(
                decoded,
                encodedImageWidth,
                encodedImageHeight,
                self.channels,
                {
                  minQuantizer: 29,
                  maxQuantizer: 31,
                  minQuantizerAlpha: 29,
                  maxQuantizerAlpha: 31,
                  tileRowsLog2: 0,
                  tileColsLog2: 0,
                  speed: 10,
                },
                3 // Chroma
              )
            );

          if (Object.is(encoderArray.length - 1, key)) self.postMessage([encoded, encodedImageWidth, encodedImageHeight, true, "avif"])
          else self.postMessage([encoded, encodedImageWidth, encodedImageHeight, false, "avif"]);

        } else if (encoder.hasOwnProperty("WebPImageHint")) {
          
          const encoded =
            new Uint8ClampedArray(
              encoder.encode(
                decoded,
                encodedImageWidth,
                encodedImageHeight,
                self.channels,
                {
                  quality: 75,
                  target_size: 0,
                  target_PSNR: 0,
                  method: 4,
                  sns_strength: 50,
                  filter_strength: 60,
                  filter_sharpness: 0,
                  filter_type: 1,
                  partitions: 0,
                  segments: 4,
                  pass: 1,
                  show_compressed: 0,
                  preprocessing: 0,
                  autofilter: 0,
                  partition_limit: 0,
                  alpha_compression: 1,
                  alpha_filtering: 1,
                  alpha_quality: 100,
                  lossless: 0,
                  exact: 0,
                  image_hint: 0,
                  emulate_jpeg_size: 0,
                  thread_level: 0,
                  low_memory: 0,
                  near_lossless: 100,
                  use_delta_palette: 0,
                  use_sharp_yuv: 0
                }
              )
            );

          if (Object.is(encoderArray.length - 1, key)) self.postMessage([encoded, encodedImageWidth, encodedImageHeight, true, "webp"])
          else self.postMessage([encoded, encodedImageWidth, encodedImageHeight, false, "webp"]);

        } else if (encoder.hasOwnProperty("J_COLOR_SPACE")) {
          
          const encoded =
            new Uint8ClampedArray(
              encoder.encode(
                decoded,
                encodedImageWidth,
                encodedImageHeight,
                self.channels,
                {
                  quality: 75,
                  baseline: false,
                  arithmetic: false,
                  progressive: true,
                  optimize_coding: true,
                  smoothing: 0,
                  in_color_space: self.colorSpace, // J_COLOR_SPACE.JCS_RGB
                  out_color_space: 3, // J_COLOR_SPACE.JCS_YCbCr
                  quant_table: 3,
                  trellis_multipass: false,
                  trellis_opt_zero: false,
                  trellis_opt_table: false,
                  trellis_loops: 1,
                  auto_subsample: true,
                  chroma_subsample: 2,
                  separate_chroma_quality: false,
                  chroma_quality: 75
                }
              )
            );

          if (Object.is(encoderArray.length - 1, key)) self.postMessage([encoded, encodedImageWidth, encodedImageHeight, true, "jpg"])
          else self.postMessage([encoded, encodedImageWidth, encodedImageHeight, false, "jpg"]);

        }

        encoder.free();
      }
    );
    
    decoder.free();
  })
}