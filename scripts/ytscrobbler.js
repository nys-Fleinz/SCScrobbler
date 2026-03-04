/** ENVOI DES INFOS QUAND
 * — le nom de la musique change
 * — le bouton `play` change
 *
 * Fais par https://github.com/nys-Fleinz.
 */
let port = null;
let debouncer;

function getTitle() {
    const titleElement = document.querySelector(".middle-controls > .content-info-wrapper > yt-formatted-string");
    return titleElement ? titleElement.innerText : "";
}

function getAvatar() {
    const avatarElement = document.querySelector("#thumbnail > #img");
    return avatarElement ? avatarElement.src : "";
}

function getData() {
    const data = document.querySelector(".middle-controls > .content-info-wrapper div.subtitle .byline");
    if (data) {
        let splitedData = data.title.split(" • ");
        return {
            author: splitedData[0] ? splitedData[0].split(" et ").join(", ") : "",
            album: splitedData[1] || "",
            year: splitedData[2] || ""
        };
    }
    return {author: "", album: "", year: ""};
}

function getExplicitBadge() {
    const explicitElement = document.querySelector('.middle-controls > .content-info-wrapper #badges');
    return explicitElement ? explicitElement.innerHTML !== '' : false;
}

function getMusicURL() {
    const url = document.querySelector("#movie_player > div.ytp-chrome-top > div.ytp-title > div > a");
    return url ? url.href : "";
}

/**
 * Return the title, author, and avatar url of the song.
 * @return {{title: string, author: string|string, album: string|string, year: string|string, avatar: string, explicit: boolean|boolean, url: string}}
 */
const getTrack = () => {
    const title = getTitle();
    const avatarElement = getAvatar();
    const {author, album, year} = getData();
    const explicit = getExplicitBadge();
    const url = getMusicURL();

    return {
        title: title,
        author: author,
        album: album,
        year: year,
        avatar: avatarElement,
        explicit: explicit,
        url: url
    };
}

/**
 * Return the state of the music
 * @return {string} "PAUSED" or "PLAYING"
 */
const getState = () => {
    const playButton = document.querySelector('#play-pause-button');
    if (!playButton) return "PAUSED";
    const state = playButton.title;
    if (state === "Mettre en pause") {
        return "PLAYING";
    }
    return "PAUSED";
};

/**
 * Return the current time progress of the song.
 * @return {number} Current time progress in `seconds`.
 */
const getCurrentTime = () => {
    const timeElement = document.querySelector("#left-controls > span");
    if (!timeElement) return 0;
    const timeString = timeElement.innerText.split(' / ')[0]
    return timeStringToSeconds(timeString);
};

/**
 * Return the duration of the track.
 * @return {number} `seconds` of the track.
 */
const getTrackDuration = () => {
    const timeElement = document.querySelector("#left-controls > span");
    if (!timeElement) return 0;
    const timeString = timeElement.innerText.split(' / ')[1]
    return timeStringToSeconds(timeString);
}

/**
 * Convert String of time in seconds
 * @param timeString {String}
 * @return {number}
 */
const timeStringToSeconds = timeString => {
    if(!timeString || timeString === "") return -1;
    let timeTab = timeString.trim().split(":").map(Number);
    let totalSeconds = 0;

    for (let i = 0; i < timeTab.length - 1; i++) {
        totalSeconds += timeTab[i] * Math.pow(60, (timeTab.length - 1 - i));
    }

    totalSeconds += timeTab[timeTab.length - 1];
    return totalSeconds;
}


/**
 * Format data and send it to the service worker script.
 */
const sendChanges = async () => {
    if (!chrome.runtime?.id) return;

    if(!port) {
        if(!await connectChromePort()) return;
    }

    try {
        const data = {
            track: getTrack(),
            currentTime: getCurrentTime(),
            trackDuration: getTrackDuration(),
            state: getState()
        }
        const formatData = JSON.stringify(data);
        port.postMessage({data: formatData});
    } catch (e) {
        port = null;
    }
}

/**
 * Se connecte au port chrome nommé `trackinfo`
 */
async function connectChromePort() {
    try {
        if (!chrome.runtime?.id) return false;
        port = chrome.runtime.connect({name: "trackinfo"});
        port.onDisconnect.addListener(() => { port = null; });
        console.log("[YTS] Port connecté.");
        return true;
    } catch (e) {
        console.error("[YTS] Port erreur: " + e);
        return false;
    }
}

const temoinHook = new MutationObserver(() => {
    clearTimeout(debouncer);
    console.log("[YTS] Changements détectés !");
    debouncer = setTimeout(sendChanges, 300);
});

const startObservation = () => {
    const controls = document.querySelector(".middle-controls");
    const playBtn = document.querySelector("#play-pause-button");

    if (controls && playBtn) {
        temoinHook.observe(controls, {childList: true, subtree: true});
        temoinHook.observe(playBtn, {attributes: true, attributeFilter: ["title"]});
        sendChanges();
    } else {
        setTimeout(startObservation, 1000);
    }
}

startObservation();

const heartBeat = async () => {
    await sendChanges();
    console.log("[YTS] HeartBeat sent.");
}

setInterval(heartBeat, 20000);