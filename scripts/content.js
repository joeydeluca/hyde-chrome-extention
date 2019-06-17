const doIfEnabled = (callback) => {
    return chrome.storage.local.get("hyde-enabled", (result) => {
        if(result['hyde-enabled'] !== false) {
            callback();
        }
    });
}

var timeout;

let validImages = [];

const getValidImages = function() {
    let images = Array.from(document.getElementsByTagName('img'))
        .filter(e => validImages.indexOf(e) === -1)
        .filter(e => e.className.indexOf('hyde') === -1)
        .filter(img => !img.currentSrc.includes('.gif') && !img.currentSrc.includes('/gif') && !img.currentSrc.includes('gradient') && !img.currentSrc.includes('.svg'))
        .filter(e => e.naturalHeight >= 80 && e.naturalWidth >= 80); // aws rek min size is 80px

    validImages = validImages.concat(images);

    return images;
}

const initiateIngestion = function(images) {
    chrome.runtime.sendMessage({
        type: "INGEST",
        payload: images
                    .slice(0, 10)
                    .map(img => (
                        {
                            "image-url": img.currentSrc,
                            "site-url": document.location.href
                        })
                    )
    });
    
}

const displayImageSearchDiv = function(element) {
    doIfEnabled(() => {
        if (timeout != null) { clearTimeout(timeout); }
        timeout = setTimeout(() => {

            if(document.getElementById("hyde_" + element.currentSrc)) {
                document.getElementById("hyde_" + element.currentSrc).style.display = "block";
                return; // Do not recreate the div 
            }

            var overlay = document.createElement("div");
            overlay.className = "hyde-overlay";
            overlay.id = "hyde_" + element.currentSrc;

            var container = document.createElement("div");
            container.className = "hyde-inline-search-container";
            container.appendChild(closeLink(overlay));

            var searchWindowDiv = document.createElement("div");
            searchWindowDiv.innerText = "Searching internet...";
            
            container.appendChild(searchWindowDiv);
            overlay.appendChild(container);
            document.body.after(overlay);
            
            searchForMatchingFaces(element.currentSrc, (result) => {
                if(result && result.length > 0) {

                    let group = result.reduce((r, a) => {
                        r[a['site-url']] = [...r[a['site-url']] || [], a['image-url']];
                        return r;
                    }, {});

                    searchWindowDiv.innerText = "";

                    let ol = document.createElement("table");
                    let tr = document.createElement("tr");
                    let td1 = document.createElement("th");
                    let td2 = document.createElement("th");
                    td1.appendChild(document.createTextNode("Website"));
                    td2.appendChild(document.createTextNode("Image"));

                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    ol.appendChild(tr);
                    
                    Object.entries(group).forEach(r => {
                        let site = r[0];
                        let images = r[1];

                        let tr = document.createElement("tr");

                        let td = document.createElement("td");
                        td.appendChild(document.createTextNode(site))

                        let found = document.createElement("div");
                        found.className = "found";
                        found.appendChild(document.createTextNode(images.length + " images found"));
                        td.appendChild(found);

                        tr.appendChild(td);

                        td = document.createElement("td");

                        const maxImagesToShow = 6;
                        images.slice(0,maxImagesToShow).forEach(i => {
                            let img = document.createElement("img");
                            img.src = i;
                            img.className = "hyde"
                            td.appendChild(img);
                        });
                        if(images.length > maxImagesToShow) {
                            let more = document.createElement("div");
                            more.className = "found";
                            more.appendChild(document.createTextNode(images.length-maxImagesToShow+" more images"));
                            td.appendChild(more);
                        }
                        
                        tr.appendChild(td);

                        ol.appendChild(tr);
                    });
                    searchWindowDiv.appendChild(ol);
                } else {
                    searchWindowDiv.innerText = "No results found.";
                }
            });
        }, 1000);
    });
}

const searchForMatchingFaces = function(url, callback) {
    const msg = {
        type: "SEARCH",
        payload: url
    }
    return chrome.runtime.sendMessage(msg, callback);
}

const closeLink = function(overlayElement) {
    let text = document.createTextNode("X");
    let a = document.createElement("a");
    a.id = "hyde-close";
    a.onclick = (e) => {e.preventDefault(); overlayElement.style.display = "none";};    
    a.appendChild(text);
    return a;
}

const addHoverHandlersToImages = function (images) {
    images.forEach(e => {
        e.onmouseenter = (a) => {displayImageSearchDiv(e); a.stopPropagation();};
        e.onmouseleave = (a) => {
            if(timeout != null) {
                clearTimeout(timeout); 
                timeout = null;
            }
            a.stopPropagation();
        }
    });
}

const start = function() {
    const images = getValidImages();

    if(images.length !== 0) {
        addHoverHandlersToImages(images);
        initiateIngestion(images);
    }
}

start();

setInterval(() => {
      start();
}, 2000);