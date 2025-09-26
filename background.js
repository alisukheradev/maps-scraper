let scrapedData = [];

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "saveData") {
    scrapedData.push(msg.data);
  }
  if (msg.action === "downloadCSV") {
    let csvContent = "data:text/csv;charset=utf-8," 
      + ["Business Name,Rating,Reviews,Latest Review Date,Latest Review Text,Email,Website,Business Hours,Profile Link"]
      + "\n"
      + scrapedData.map(r => [
        r.name, r.rating, r.reviews, r.latestDate, r.latestText, 
        r.email, r.website, r.hours, r.link
      ].map(v => `"${v}"`).join(",")).join("\n");

    let blob = new Blob([decodeURIComponent(encodeURI(csvContent))], { type: "text/csv" });
    let url = URL.createObjectURL(blob);
    chrome.downloads.download({
      url: url,
      filename: "maps_results.csv"
    });
  }
});
