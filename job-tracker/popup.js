document.addEventListener('DOMContentLoaded', function() {
  const trackButton = document.getElementById('trackButton');
  const markApplied = document.getElementById('markApplied');
  const removeButton = document.getElementById('removeButton');
  const statusDiv = document.getElementById('status');
  const applicationsDiv = document.getElementById('applications');
  
  let currentUrl = '';
  let currentTitle = '';
  
  // Get current tab URL
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    currentUrl = tabs[0].url;
    currentTitle = tabs[0].title || 'Job Application';
    
    // Check if this URL is already tracked
    chrome.storage.local.get(['applications'], function(result) {
      const applications = result.applications || {};
      
      if (applications[currentUrl]) {
        // Already applied
        statusDiv.innerHTML = '<p class="tracking">✓ You have already applied to this job on ' + 
                             new Date(applications[currentUrl].date).toLocaleDateString() + '</p>';
        trackButton.style.display = 'none';
        markApplied.style.display = 'none';
        removeButton.style.display = 'block';
      } else if (applications['tracking_' + currentUrl]) {
        // Currently tracking
        statusDiv.innerHTML = '<p class="tracking">Currently tracking this job application</p>';
        trackButton.style.display = 'none';
      } else {
        // Not tracking
        statusDiv.innerHTML = '<p class="not-tracking">Not tracking this job application</p>';
        removeButton.style.display = 'none';
      }
      
      // Display all applications
      displayApplications(applications);
    });
  });
  
  // Start tracking button
  trackButton.addEventListener('click', function() {
    chrome.storage.local.get(['applications'], function(result) {
      const applications = result.applications || {};
      
      // Mark as tracking
      applications['tracking_' + currentUrl] = {
        title: currentTitle,
        date: new Date().toISOString()
      };
      
      chrome.storage.local.set({applications: applications}, function() {
        // Send message to content script to start tracking
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "startTracking"});
          
          statusDiv.innerHTML = '<p class="tracking">Currently tracking this job application</p>';
          trackButton.style.display = 'none';
          
          displayApplications(applications);
        });
      });
    });
  });
  
  // Mark as applied manually
  markApplied.addEventListener('click', function() {
    chrome.storage.local.get(['applications'], function(result) {
      const applications = result.applications || {};
      
      // Mark as applied
      applications[currentUrl] = {
        title: currentTitle,
        date: new Date().toISOString(),
        manuallyMarked: true
      };
      
      // Remove from tracking if it was being tracked
      delete applications['tracking_' + currentUrl];
      
      chrome.storage.local.set({applications: applications}, function() {
        statusDiv.innerHTML = '<p class="tracking">✓ Manually marked as applied</p>';
        trackButton.style.display = 'none';
        markApplied.style.display = 'none';
        removeButton.style.display = 'block';
        
        displayApplications(applications);
      });
    });
  });
  
  // Remove from applied
  removeButton.addEventListener('click', function() {
    chrome.storage.local.get(['applications'], function(result) {
      const applications = result.applications || {};
      
      // Remove from applied
      delete applications[currentUrl];
      
      chrome.storage.local.set({applications: applications}, function() {
        statusDiv.innerHTML = '<p class="not-tracking">Removed from applied jobs</p>';
        trackButton.style.display = 'block';
        markApplied.style.display = 'block';
        removeButton.style.display = 'none';
        
        displayApplications(applications);
      });
    });
  });
  
  function displayApplications(applications) {
    // Clear the applications div
    applicationsDiv.innerHTML = '';
    
    let hasApplications = false;
    
    // Display all applied jobs (not tracking ones)
    for (const url in applications) {
      if (!url.startsWith('tracking_')) {
        hasApplications = true;
        const app = applications[url];
        const date = new Date(app.date).toLocaleDateString();
        
        const appElement = document.createElement('div');
        appElement.className = 'application-item';
        appElement.innerHTML = `
          <div><strong>${app.title}</strong></div>
          <div>Applied: ${date}</div>
          <div><a href="${url}" target="_blank">Open</a></div>
        `;
        
        applicationsDiv.appendChild(appElement);
      }
    }
    
    if (!hasApplications) {
      applicationsDiv.innerHTML = '<div class="application-item">No applications tracked yet.</div>';
    }
  }
});
