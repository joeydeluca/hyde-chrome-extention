chrome.runtime.onInstalled.addListener(function() {
    // add an action here
}); 

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch(msg.type) {
        case 'INGEST': ingest(msg.payload); break;
        case 'SEARCH': search(msg.payload, sendResponse); break;
    }
    return true;
});

function ingest(payload) {    
    fetch('https://8ye3e8y414.execute-api.us-east-1.amazonaws.com/dev/image', {
        method: 'post',
        body: JSON.stringify(payload)
    });
}

function search(url, sendResponse) {
    fetch('https://8ye3e8y414.execute-api.us-east-1.amazonaws.com/dev/search', {
        method: 'post',
        body: JSON.stringify({
            "image-url": url
        })
    })
    .then(res => {
        if(res.status == 200) return res.json();
        throw new Error(res);
    }, 
    error => {sendResponse([])})
    .then(response => Array.from(new Set(response.map(JSON.stringify))).map(JSON.parse))
    .then(response => {response.sort(function(a, b){return a['site-url'] > b['site-url'] ? 1 : a['site-url'] < b['site-url'] ? -1 : 0}); return response;})
    .then(response => sendResponse(response))
    .catch((error) => sendResponse([]));
}


