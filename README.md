# Image Optimizer
A tool to optimize images for the web, allowing conversion, resizing, and compression.

Made using:
- TypeScript
- WebAssembly
- Web Workers

Benefits:
- No server needed
- Using client's processor means no business logic/edge/lambda functions required = cost effective
- Can work offline (assuming necessary JavaScript is downloaded on initial load)

To do:
- Research and fix glitch where some images load rotated and blurry (perhaps colorspace and/or channels issue?)
- Implement the Service Worker API and [@Touffy](https://www.github.com/Touffy)'s client-side streaming ZIP generator: [client-zip](https://github.com/Touffy/client-zip)
