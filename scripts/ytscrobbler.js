/** ENVOI DES INFOS QUAND
 * — le nom de la musique change
 * — le bouton `play` change
 *
 * Fais par https://github.com/nys-Fleinz.
 */
let port = chrome.runtime.connect({name: "trackinfo"});
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
    const data = document.querySelector(".middle-controls > .content-info-wrapper div.subtitle .byline").title.split(" • ");
    if (data && data.length > 0) {
        return {author: data.at(0).split(" et ").join(", "), album: data.at(1), year: data.at(2)};
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
    const timeString = timeElement.innerText.split(' / ')[0]
    return timeStringToSeconds(timeString);
};

/**
 * Return the duration of the track.
 * @return {number} `seconds` of the track.
 */
const getTrackDuration = () => {
    const timeElement = document.querySelector("#left-controls > span");
    const timeString = timeElement.innerText.split(' / ')[1]
    return timeStringToSeconds(timeString);
}

/**
 * Convert String of time in seconds
 * @param timeString {String}
 * @return {number}
 */
const timeStringToSeconds = timeString => {
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
const sendChanges = () => {
    const data = {
        track: getTrack(),
        currentTime: getCurrentTime(),
        trackDuration: getTrackDuration(),
        state: getState()
    }
    const formatData = JSON.stringify(data);
    port.postMessage({data: formatData});
}


const temoinHook = new MutationObserver(() => {
    clearTimeout(debouncer);
    console.log("[YTS] Changements détectés !");
    debouncer = setTimeout(sendChanges, 300);
});

temoinHook.observe(document.querySelector(".middle-controls"), {childList: true, subtree: true});
temoinHook.observe(document.querySelector("#play-pause-button"), {childList: true, subtree: true});


port.onDisconnect.addListener(() => {
    port = null;
});

const heartBeat = () => {
    sendChanges();
}

setInterval(heartBeat, 20000);