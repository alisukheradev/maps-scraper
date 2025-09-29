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
    // Automatically save data when scrolling stops*******************************************
    datasave();
  } else {
    logToPopup("Not scrolling right now.");
  }
}

function datasave() {
  try {
    const feed = document.querySelector("div[role='feed']");
    if (!feed) {
      console.log("❌ Feed not found.");
      return;
    }

    // Identify each feed item (card/article) and group its data
    const items = feed.querySelectorAll("div[role='article'], div.Nv2PK");
    const itemSet = new Set();

    items.forEach((item, index) => {
      const hrefs = new Set();
      const ariaLabels = new Set();

      item.querySelectorAll('[href]').forEach((node) => {
        const v = node.getAttribute('href');
        if (v) hrefs.add(v);
      });

      // Collect ALL aria-label values within this item (not just the first)
      item.querySelectorAll('[aria-label]').forEach((node) => {
        const v = node.getAttribute('aria-label');
        if (v) ariaLabels.add(v);
      });

      const grouped = {
        index,
        tag: item.tagName,
        id: item.id || null,
        classes: item.className || '',
        hrefs: Array.from(hrefs),
        ariaLabels: Array.from(ariaLabels)
      };
      itemSet.add(grouped);
    });
    console.log(`🧩 Feed items grouped: ${items.length}`);
  
    // Transform groups to records matching background schema
    const records = Array.from(itemSet).map((group) => {
      // Extract rating and reviews from aria-labels using regex
      let rating = '';
      let reviews = '';
      
      for (const label of group.ariaLabels) {
        // Look for pattern: float + string* + integer + string* (language independent ı think need to be tested)
        const ratingReviewMatch = label.match(/(\d+[,.]?\d*).*?(\d+)/);
        if (ratingReviewMatch) {
          rating = ratingReviewMatch[1].replace(',', '.');
          reviews = ratingReviewMatch[2];
          break;
        }
      }
      
      return {
        name: group.ariaLabels[0] || '',
        rating: rating,
        reviews: reviews,
        link: group.hrefs[0] || '',
      };
    });

    // Send ALL records in a single message
    try {
      const messageObj = { action: 'saveData', data: records };
      chrome.runtime.sendMessage(messageObj);
      console.log(`📤 saveData sent with ${records.length} records (single message).`);
      console.log('📤 Sent object:', messageObj);
    } catch (e) {
      console.log('❌ Failed to send saveData batch:', e);
    }
  } catch (e) {
    console.log("❌ datasave error: " + e.message);
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
