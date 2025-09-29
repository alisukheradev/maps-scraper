let scrapedData = [];

console.log("Background script loaded and ready");

// Test if background is working
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed/updated - background script is working!");
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Background received message:", msg);
  if (msg.action === "saveData") {
    // msg.data is already an array, so we need to spread it
    scrapedData.push(...msg.data);
    console.log("Data saved to array. Current count:", scrapedData.length);
    console.log("Saved data:", msg.data);
  }
  if (msg.action === "downloadCSV") {
    if (scrapedData.length === 0) {
      sendResponse({ status: "no_data" });
      return;
    }
    
    console.log("Starting CSV download with", scrapedData.length, "records");
    
    let csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "Business Name,Rating,Reviews,Profile Link",
      ] +
      "\n" +
      scrapedData
        .map((r) =>
          [
            r.name,
            r.rating,
            r.reviews,
            r.link,
          ]
            .map((v) => `"${v}"`)
            .join(",")
        )
        .join("\n");

    // Create data URL instead of blob URL for service worker
    let dataUrl = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    try {
      chrome.downloads.download(
        {
          url: dataUrl,
          filename: "maps_results.csv",
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Download failed: " + chrome.runtime.lastError.message
            );
            sendResponse({ status: "error", message: chrome.runtime.lastError.message });
          } else {
            console.log("Download started successfully with ID:", downloadId);
            sendResponse({ status: "success" });
          }
        }
      );
    } catch (e) {
      console.error("Error during download request:", e);
      sendResponse({ status: "error", message: e.message });
    }
  }
});
