let url = "ws://localhost:3000/webhook/";
let websocket = null;


const connect = () => {
    if (websocket && (websocket.readyState === websocket.OPEN || websocket.readyState === websocket.CONNECTING)) {
        console.log("BACK ONLINE");
        return;
    }
    console.log("Connecting...");
    websocket = new WebSocket(url);

    websocket.addEventListener("open", () => {
        console.log("CONNECTED!");
    })

    websocket.addEventListener("close", () => {
        setTimeout(connect, 5000);
    })
}

chrome.runtime.onConnect.addListener(function (port) {
    if (port.name !== "trackinfo") return;

    port.onMessage.addListener(function (msg) {
        if (websocket && websocket.readyState !== websocket.OPEN) {
            console.log("WebSocket hors ligne impossible d'envoyer les données.");
            return;
        }
        websocket.send(msg.data);
        console.log("Message received:\n" + msg.data);
    });
});

connect();