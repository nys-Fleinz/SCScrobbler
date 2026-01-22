let url = "ws://localhost:3000";
let websocket = new WebSocket(url);

let intervalReconnect;

websocket.addEventListener("open", () => {
    console.log("CONNECTED!");
})


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (websocket.readyState === websocket.OPEN) {
        websocket.send(message);
        console.log("message sent");
    }
});

websocket.addEventListener("close", () => {
    intervalReconnect = setInterval(connect, 5000);
})

const connect = () => {
    if (websocket.readyState === websocket.OPEN) {
        console.log("BACK ONLINE");
        clearInterval(intervalReconnect);
        return;
    }
    console.log("Connecting...");
    websocket = new WebSocket(url);
}

chrome.runtime.onConnect.addListener(function (port) {
    if (port.name !== "trackinfo") return;


    port.onMessage.addListener(function (msg) {
        if (websocket.readyState !== websocket.OPEN) {
            console.log("WebSocket hors ligne impossible d'envoyer les données.");
            return;
        }
        websocket.send(msg.data);
        console.log("Message received:\n" + msg.data.currentTime);
    });
});