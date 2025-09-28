let scrapedData = [];

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "saveData") {
    scrapedData.push(msg.data);
    console.log("Data saved to array. Current count:", scrapedData.length);
    console.log("Saved data:", msg.data);
  }
  if (msg.action === "downloadCSV") {
    if (scrapedData.length === 0) {
      sendResponse({ status: "no_data" });
      return; // rk ja, kuch nae hai download krny ko.
      let csvContent =
        "data:text/csv;charset=utf-8," +
        [
          "Business Name,Rating,Reviews,Latest Review Date,Latest Review Text,Email,Website,Business Hours,Profile Link",
        ] +
        "\n" +
        scrapedData
          .map((r) =>
            [
              r.name,
              r.rating,
              r.reviews,
              r.latestDate,
              r.latestText,
              r.email,
              r.website,
              r.hours,
              r.link,
            ]
              .map((v) => `"${v}"`)
              .join(",")
          )
          .join("\n");

      let blob = new Blob([decodeURIComponent(encodeURI(csvContent))], {
        type: "text/csv",
      });
      let url = URL.createObjectURL(blob);
      try {
        chrome.downloads.download(
          {
            url: url,
            filename: "maps_results.csv",
          },
          (downloadId) => {
            if (chrome.runtime.lastError) {
              console.error(
                "Download failed: " + chrome.runtime.lastError.message
              );
            } else {
              console.log("Download started successfully with ID:", downloadId);
              sendResponse({ status: "success" }); // ho gya
            }
          }
        );
      } catch (e) {
        console.error("Error during download request:", e);
      }
    }
  }
});
