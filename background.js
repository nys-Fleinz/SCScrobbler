chrome.runtime.onMessage.addListener((msg) => {
  console.log("🎧 Chanson actuelle :", msg.artist, "-", msg.title);
});
