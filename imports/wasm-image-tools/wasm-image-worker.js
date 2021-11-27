self.importScripts('./wasm_image_loader.min.js', './wasm_avif.min.js', './wasm_webp.min.js', './wasm_mozjpeg.min.js');

self.onmessage = e => {
  const buffer = e.data[0],
  fileTypeList = new Array();
  for (fileType of e.data[1]) {
    fileTypeList.push(eval(fileType))
  }
  
  Promise.all([wasm_image_loader(), ...fileTypeList])
  .then(resultsArray => {

    const decoder = resultsArray[0],
    decoded = decoder.decode(buffer, buffer.length, 4),
    { width, height } = decoder.dimensions();

    resultsArray.slice(1).forEach(encoder =>
      {

        if (encoder.hasOwnProperty("AVIF_PIXEL_FORMAT")) {
          
          const encoded =
            new Uint8ClampedArray(
              encoder.encode(
                decoded,
                width, // Width
                height, // Height
                4, // Channels
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

          self.postMessage([encoded, width, height, "AVIF"]);

        } else if (encoder.hasOwnProperty("WebPImageHint")) {
          
          const encoded =
            new Uint8ClampedArray(
              encoder.encode(
                decoded,
                width, // Width
                height, // Height
                4, // Channels
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

          self.postMessage([encoded, width, height, "WebP"]);

        } else if (encoder.hasOwnProperty("J_COLOR_SPACE")) {
          
          const encoded =
            new Uint8ClampedArray(
              encoder.encode(
                decoded,
                width, // Width
                height, // Height
                4, // Channels
                {
                  quality: 75,
                  baseline: false,
                  arithmetic: false,
                  progressive: true,
                  optimize_coding: true,
                  smoothing: 0,
                  in_color_space: 12, // J_COLOR_SPACE.JCS_RGB
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

          self.postMessage([encoded, width, height, "JPEG"]);

        }

        encoder.free();
      }
    );
    
    decoder.free();
  })
}