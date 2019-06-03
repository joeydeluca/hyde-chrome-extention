const getValidImages = function() {
    return Array.from(
        document.getElementsByTagName('img'))
        .filter(img => !img.currentSrc.includes('.gif') && !img.currentSrc.includes('/gif')
    );
}

const payload = getValidImages()
    .slice(0, 10)
    .map(img => (
        {
            "image-url": img.currentSrc,
            "site-url": document.location.href
        })
    );

const msg = {
    type: "INGEST",
    payload
}

chrome.runtime.sendMessage(msg);

const displayImageSearchDiv = function(element) {
    setTimeout(() => {
        if(document.getElementById("hyde_" + element.currentSrc)) {
            document.getElementById("hyde_" + element.currentSrc).style.display = "block";
            return; // Do not recreate the div 
        }

        var container = document.createElement("div");
        container.className = "hyde-inline-search-container";
        container.id = "hyde_" + element.currentSrc;
        container.appendChild(closeLink(container));

        var searchWindowDiv = document.createElement("div");
        searchWindowDiv.innerText = "Searching internet...";
        element.after(container);
        container.appendChild(searchWindowDiv);


        searchForMatchingFaces(element.currentSrc, (result) => {
            if(result && result.length > 0) {
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
                
                result.forEach(r => {
                    let tr = document.createElement("tr");

                    let td = document.createElement("td");
                    td.appendChild(document.createTextNode(r['site-url']))
                    tr.appendChild(td);

                    td = document.createElement("td");

                    let img = document.createElement("img");
                    img.src = r['image-url'];
                    img.style.width = "50px";

                    td.appendChild(img);
                    tr.appendChild(td);

                    ol.appendChild(tr);
                });
                searchWindowDiv.appendChild(ol);
            } else {
                searchWindowDiv.replaceChild = document.createTextNode("No results found.");
            }
        });
    }, 1000);
}

const searchForMatchingFaces = function(url, callback) {
    const msg = {
        type: "SEARCH",
        payload: url
    }
    return chrome.runtime.sendMessage(msg, callback);
}

const closeLink = function(containerElement) {
    let text = document.createTextNode("close");
    let a = document.createElement("a");
    a.id = "hyde-close";
    a.onclick = (e) => {e.preventDefault(); containerElement.style.display = "none";};    
    a.appendChild(text);
    return a;
}

getValidImages().forEach(e => e.onmouseover = () => displayImageSearchDiv(e));