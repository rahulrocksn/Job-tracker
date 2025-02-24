let isTracking = false;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "startTracking") {
    isTracking = true;
    trackFormSubmissions();
  }
});

// Check if we're already tracking this page
chrome.storage.local.get(['applications'], function(result) {
  const applications = result.applications || {};
  const currentUrl = window.location.href;
  
  if (applications['tracking_' + currentUrl]) {
    isTracking = true;
    trackFormSubmissions();
  }
  
  // If already applied, show notification
  if (applications[currentUrl]) {
    showAppliedNotification();
  }
});

// Track form submissions
function trackFormSubmissions() {
  // Listen for all form submissions
  document.addEventListener('submit', function(e) {
    // Get the URL before navigation
    const currentUrl = window.location.href;
    const pageTitle = document.title || 'Job Application';
    
    // Save this as a potential last submission
    savePotentialSubmission(currentUrl, pageTitle);
  });
  
  // Also track button clicks that might be submissions via JavaScript
  document.addEventListener('click', function(e) {
    // Look for submit buttons or buttons with submit-like text
    const target = e.target;
    const isSubmitButton = 
      (target.tagName === 'BUTTON' || 
       (target.tagName === 'INPUT' && target.type === 'submit') ||
       target.classList.contains('submit') ||
       target.id.toLowerCase().includes('submit') ||
       (target.textContent && 
        (target.textContent.toLowerCase().includes('submit') ||
         target.textContent.toLowerCase().includes('apply') ||
         target.textContent.toLowerCase().includes('complete')))
      );
    
    if (isSubmitButton) {
      // This looks like a submission button
      const currentUrl = window.location.href;
      const pageTitle = document.title || 'Job Application';
      
      savePotentialSubmission(currentUrl, pageTitle);
    }
  });
}

// Save a potential submission
function savePotentialSubmission(url, title) {
  // Save this as a potential last submission with a timestamp
  chrome.storage.local.set({
    'potentialSubmission': {
      url: url,
      title: title,
      timestamp: new Date().toISOString()
    }
  });
}

// Show notification for already applied jobs
function showAppliedNotification() {
  // Create a notification element
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.backgroundColor = '#4285f4';
  notification.style.color = 'white';
  notification.style.padding = '15px';
  notification.style.borderRadius = '5px';
  notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  notification.style.zIndex = '10000';
  notification.style.maxWidth = '300px';
  
  notification.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 5px;">Job Application Tracker</div>
    <div>You have already applied to this job.</div>
  `;
  
  // Add close button
  const closeButton = document.createElement('div');
  closeButton.style.position = 'absolute';
  closeButton.style.top = '5px';
  closeButton.style.right = '10px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontSize = '16px';
  closeButton.textContent = '×';
  closeButton.addEventListener('click', function() {
    document.body.removeChild(notification);
  });
  
  notification.appendChild(closeButton);
  document.body.appendChild(notification);
  
  // Remove after 5 seconds
  setTimeout(function() {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 5000);
}

