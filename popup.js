document.getElementById("start").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: "START_SCROLL_ONLY", delayMin: 1200, delayMax: 2000 });
  document.getElementById("status").innerText = "Scrolling started...";
});

document.getElementById("stop").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: "STOP_SCROLL_ONLY" });
  document.getElementById("status").innerText = "Scrolling stopped.";
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "GM_LOG") {
    document.getElementById("status").innerText = msg.text;
  }
});
