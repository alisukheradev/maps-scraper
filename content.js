let scrollInterval = null;
let profileCount = 0;

function logToPopup(text) {
  try {
    chrome.runtime.sendMessage({ type: "GM_LOG", text });
  } catch (e) {
    console.error("Failed to send message to background script:", e);
  }
}

function isEndOfList() {
  const spans = document.querySelectorAll("span.HlvSq");
  for (let span of spans) {
    if (span.innerText.includes("You've reached the end of the")) {
      return true;
    }
  }
  return false;
}

function countProfiles() {
  // Try multiple selectors (Google changes often)
  const profiles = document.querySelectorAll("div[role='article'], div.Nv2PK");
  profileCount = profiles.length;
  logToPopup(`👤 Profiles found so far: ${profileCount}`);
}

function startScrolling(delayMin = 1200, delayMax = 2000) {
  if (scrollInterval) {
    logToPopup("Already scrolling...");
    return;
  }

  let scrollContainer = null;
  try {
    scrollContainer = document.querySelector("div[role='feed']");
  } catch (e) {
    logToPopup("❌ Error finding the scroll container: " + e.message);
    return;
  }
  logToPopup("✅ Scrolling started...");

  scrollInterval = setInterval(() => {
    if (isEndOfList()) {
      clearInterval(scrollInterval);
      scrollInterval = null;
      countProfiles();
      logToPopup("🎉 Reached the end of the list!");
      logToPopup(`📊 Final profile count: ${profileCount}`);
      return;
    }

    scrollContainer.scrollBy(0, 500);
    countProfiles();
    logToPopup("🔄 Scrolling...");
  }, Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin);
}

function stopScrolling() {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
    logToPopup("⏹ Scrolling stopped.");
    logToPopup(`📊 Profiles collected so far: ${profileCount}`);
  } else {
    logToPopup("Not scrolling right now.");
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "START_SCROLL_ONLY") {
    startScrolling(message.delayMin, message.delayMax);
  }
  if (message.action === "STOP_SCROLL_ONLY") {
    stopScrolling();
  }
});
