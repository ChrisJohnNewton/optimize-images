self.importScripts('./imports/client-zip/client-zip.js');

// self.onmessage = e => {
//     (async () => {
//         // define what we want in the ZIP
//         const code = await fetch("https://raw.githubusercontent.com/Touffy/client-zip/master/src/index.ts")
//         const intro = { name: "intro.txt", lastModified: new Date(), input: "Hello. This is the client-zip library." }
    
//         // get the ZIP stream in a Blob
//         const blob = await downloadZip([intro, code]).blob();

//         self.postMessage(blob);
//     })();
// }


/** generate Responses by iterating over a list of URLs */
async function* activate(urls) {
    for (const url of urls) {
      try {
        const response = await fetch(url)
        if (!response.ok)
          console.warn(`skipping ${response.status} response for ${url}`)
        else if (response.status === 204 || response.headers.get("Content-Length") === "0" || !response.body)
          console.warn(`skipping empty response for ${url}`)
        else yield response
      } catch (err) {
        console.error(err)
      }
    }
  }
  
  self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url)
    // This will intercept all request with a URL starting in /downloadZip/ ;
    // you should use a meaningful URL for each download, for example /downloadZip/invoices.zip
    const [,name] = url.pathname.match(/\/downloadZip\/(.+)/i) || [,]
    if (url.origin === self.origin && name)
      event.respondWith(event.request.formData()
        .then(data => downloadZip(activate(data.getAll('url'))))
        .catch(err => new Response(err.message, { status: 500 }))
      )
  })