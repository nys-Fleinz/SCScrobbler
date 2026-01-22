/** ENVOI DES INFOS QUAND
 * — le nom de la musique change
 * — le bouton play est changé
 *
 * Fais par https://github.com/nys-Fleinz.
 */
const port = chrome.runtime.connect({name: "trackinfo"});
let debouncer;


/**
 * Return the title, author, and avatar url of the song.
 * @return {{title: string, author: string, avatar: string}}
 */
const getBadgeData = () => {
    const titleElement = document.querySelector(".playbackSoundBadge__titleLink").lastElementChild;
    const authorElement = document.querySelector(".playbackSoundBadge__lightLink");
    const avatarElement = document.querySelector(".playbackSoundBadge__avatar");

    const avatarUrl = avatarElement.querySelector("div > span")
        .style.backgroundImage
        .replace('url("', "")
        .replace('")', "");

    return { title:titleElement.innerText, author:authorElement.innerText, avatar:avatarUrl }
}

/**
 * Return the state of the music
 * @return {string} "PAUSED" or "PLAYING"
 */
const getState = () => {
    const playButton = document.querySelector(".playControl");
    const state = playButton.querySelector("div > span");
    if(state.textContent === "Pause current") {
        return "PLAYING";
    }
    return "PAUSED";
};

/**
 * Return the current time progress of the song.
 * @return {number} Current time progress in `seconds`.
 */
const getCurrentTime = () => {
    const timeElement = document.querySelector(".playbackTimeline__timePassed");
    const timeString = timeElement.lastElementChild.textContent;
    return timeStringToSeconds(timeString);
};

/**
 * Return the duration of the track.
 * @return {number} `seconds` of the track.
 */
const getTrackDuration = () => {
    const durationElement = document.querySelector(".playbackTimeline__duration");
    const durationString = durationElement.lastElementChild.textContent;
    return timeStringToSeconds(durationString);
}

/**
 * Convert String of time in seconds
 * @param timeString {String}
 * @return {number}
 */
const timeStringToSeconds = timeString => {
    let timeTab = timeString.trim().split(":").map(Number); // [ 4, 27 ]
    let totalSeconds = 0;

    for(let i = 0; i<timeTab.length-1; i++) {
        totalSeconds += timeTab[i] * Math.pow(60, (timeTab.length - 1 - i));
    }

    totalSeconds += timeTab[timeTab.length-1];
    return totalSeconds;
}


/**
 * Format data and send it to the service worker script.
 */
const sendChanges = () => {
    const data = {
        track: getBadgeData(),
        currentTime: getCurrentTime(),
        trackDuration: getTrackDuration(),
        state: getState()
    }
    const formatData = JSON.stringify(data);
    port.postMessage({ data: formatData});
}


const temoinHook = new MutationObserver((mutations) => {
    console.log("[SCS] Changements détectés !");
    clearTimeout(debouncer);
    debouncer = setTimeout(sendChanges, 300);
});

temoinHook.observe(document.querySelector(".playbackSoundBadge"), { childList: true, subtree:true });
temoinHook.observe(document.querySelector(".playControl"), { childList: true, subtree: true });