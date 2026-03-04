let WSPort = 3000;
let websocket = null;

/**
 * Retourne le port stocké dans le stockage Chrome.
 * @return {Promise<number>}
 */
const getPortFromStorage = async () => {
    const result = chrome.storage.local.get(["WSPort"]);
    return result.WSPort || 3000;
}

const connect = () => {
    let url = `ws://localhost:${WSPort}/webhook/`;

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

(async () => {
    console.log("Démarrage du Service Worker...");
    WSPort = await getPortFromStorage();
    connect();
})();

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

    port.onDisconnect.addListener(() => {
        console.log("L'onglet changé, suppression status.");
        websocket.send({state: 'PAUSED'});
    });
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.port && message.port !== WSPort) {
        changePort(message.port);
    }
})

/**
 * Changer le port que l'extension utiliser pour se connecter au WebSocket.
 * @param port
 */
const changePort = port => {
    WSPort = port;
    websocket = null;
    connect();
}