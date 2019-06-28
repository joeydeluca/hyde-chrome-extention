chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {
              schemes: [ 'http', 'https' ]
          },
        })
        ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
      }]);
    });
}); 

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch(msg.type) {
        case 'INGEST': ingest(msg.payload); break;
        case 'SEARCH': search(msg.payload, sendResponse); break;
    }
    return true;
});

function ingest(payload) {
    getOrCreateClientId(function(clientId) {
        fetch('https://8ye3e8y414.execute-api.us-east-1.amazonaws.com/dev/image', {
            method: 'post',
            headers: {'client-id': clientId},
            body: JSON.stringify(payload)
        });
    });
}

function search(url, sendResponse) {
    getOrCreateClientId(function(clientId) {
        fetch('https://8ye3e8y414.execute-api.us-east-1.amazonaws.com/dev/search', {
            method: 'post',
            headers: {'client-id': clientId},
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
    });
}

let uuid;
function getOrCreateClientId(callback) {
    if (uuid) {
        callback(uuid);
        return;
    }

    chrome.storage.local.get(['hydeClientId'], function(result) {
        if(result && result.hydeClientId) {
            callback(result.hydeClientId);
        } else {
            uuid = uuidv4();
            callback(uuid);
            chrome.storage.local.set({hydeClientId: uuid});
        }
    });
}

function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}