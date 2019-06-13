chrome.storage.onChanged.addListener(function(changes, namespace) {
    if(changes['hyde-enabled']) {
        if(changes['hyde-enabled'].newValue !== false) {
            setEnableStatusMessage();
        } else {
            setDisableStatusMessage();
        }
    }
});

document.getElementById("btn-enable").onclick = () => chrome.storage.local.set({'hyde-enabled': true});

document.getElementById("btn-disable").onclick = () => chrome.storage.local.set({'hyde-enabled': false});

chrome.storage.local.get("hyde-enabled", (result) => {
        if(result['hyde-enabled'] !== false) {
            setEnableStatusMessage();
        } else {
            setDisableStatusMessage();
        }
});

function setEnableStatusMessage() {
    document.getElementById("hyde-status").innerText = "Hyde is enabled.";
}

function setDisableStatusMessage() {
    document.getElementById("hyde-status").innerText = "Hyde is disabled.";
}