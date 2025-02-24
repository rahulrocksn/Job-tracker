// background.js
// When a page finishes loading, check if we need to mark as applied
chrome.webNavigation.onCompleted.addListener(function(details) {
  // Only consider main frame navigations (not iframes)
  if (details.frameId !== 0) return;
  
  // Check if there was a potential submission recently
  chrome.storage.local.get(['potentialSubmission', 'applications'], function(result) {
    const potentialSubmission = result.potentialSubmission;
    const applications = result.applications || {};
    
    // If there's a potential submission and we've navigated away from that page
    if (potentialSubmission && potentialSubmission.url !== details.url) {
      // Check if the timestamp is recent (within last 30 seconds)
      const submissionTime = new Date(potentialSubmission.timestamp).getTime();
      const currentTime = new Date().getTime();
      
      if (currentTime - submissionTime < 30000) { // 30 seconds
        // This is likely a successful submission that led to a page change
        // Mark the original URL as applied
        applications[potentialSubmission.url] = {
          title: potentialSubmission.title,
          date: potentialSubmission.timestamp
        };
        
        // Remove tracking status if it exists
        delete applications['tracking_' + potentialSubmission.url];
        
        // Clear the potential submission
        chrome.storage.local.set({
          applications: applications,
          potentialSubmission: null
        });
      }
    }
  });
});

// Listen for tab updates to show notification on page load
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete') {
    // Check if this URL is in our applied list
    chrome.storage.local.get(['applications'], function(result) {
      const applications = result.applications || {};
      
      if (applications[tab.url]) {
        // Send message to content script to show notification
        chrome.tabs.sendMessage(tabId, {action: "showAppliedNotification"});
      }
    });
  }
});
