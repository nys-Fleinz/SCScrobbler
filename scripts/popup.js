const formPort = document.querySelector(".formPort");
const port = formPort.querySelector("input[name=port]");
const submitButton = formPort.querySelector("button[type=submit]");

submitButton.addEventListener("click", (event) => {
    event.preventDefault();
    if(port.value) {
        chrome.storage.local.set({ WSPort: port.value }, () => {
            console.log("Port sauvegardé : " + port.value);
            chrome.runtime.sendMessage({ port: port.value });
        });
    }
})

chrome.storage.local.get(["WSPort"], (result) => {
    if (result.WSPort) {
        port.value = result.WSPort;
    }
});