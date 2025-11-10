function sendTrackInfo() {
  const title = document.querySelector('.playbackSoundBadge__titleLink')?.innerText.trim();
  const artist = document.querySelector('.playbackSoundBadge__lightLink')?.innerText.trim();

  if (title && artist) {
    chrome.runtime.sendMessage({ artist, title });
  }
}

setInterval(sendTrackInfo, 2000);
