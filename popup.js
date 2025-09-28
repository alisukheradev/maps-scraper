document.getElementById("start").addEventListener("click", async () => {
  try {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        action: "START_SCROLL_ONLY",
        delayMin: 1200,
        delayMax: 2000,
      });
      document.getElementById("status").innerText = "Scrolling started...";
    } else {
      document.getElementById("status").innerText =
        "Could not find an active tab.";
    }
  } catch (e) {
    document.getElementById("status").innerText =
      "An error occurred: " + e.message;
  }
});

document.getElementById("stop").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: "STOP_SCROLL_ONLY" });
  document.getElementById("status").innerText = "Scrolling stopped.";
});

document.getElementById("download").addEventListener("click", () => {
  console.log("Download button clicked. Sending request.");
  chrome.runtime.sendMessage({ action: "downloadCSV" }, (response) => {
    console.log("Response from background script:", response);
    if (response && response.status === "no_data") {
      document.getElementById("status").innerText =
        "No profiles scraped yet. Start scrolling first!";
    } else {
      document.getElementById("status").innerText =
        "Download initiated. Check your downloads folder.";
    }
  });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "GM_LOG") {
    document.getElementById("status").innerText = msg.text;
  }
});
