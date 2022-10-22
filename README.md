# Image Optimizer
A tool to optimize images for the web, allowing conversion, resizing, and compression.

Made using:
- TypeScript
- WebAssembly
- Web Workers

Open source usage:
- [@saschazar21](https://github.com/saschazar21)'s WebAssembly Monorepo. Particularly, [wasm-image-loader](https://github.com/saschazar21/webassembly/tree/main/packages/image-loader), [wasm-avif](https://github.com/saschazar21/webassembly/tree/main/packages/avif), [wasm-webp](https://github.com/saschazar21/webassembly/tree/main/packages/webp), and [wasm-mozjpeg](https://github.com/saschazar21/webassembly/tree/main/packages/mozjpeg).

Benefits:
- No server needed
- Using client's processor means no business logic/edge/lambda functions required = cost effective
- Can work offline (assuming necessary JavaScript is downloaded on initial load)

To do:
- Research [“memory access out of bounds”](https://github.com/saschazar21/webassembly/issues/453) issue that is sometimes preventing the loading of images
- Implement the Service Worker API and [@Touffy](https://www.github.com/Touffy)'s client-side streaming ZIP generator: [client-zip](https://github.com/Touffy/client-zip)
