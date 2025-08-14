// AutoScrapePro Background Service Worker

let scrapingSession = null;
let serverUrl = 'https://autoscrappro.replit.dev'; // Default server URL

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('AutoScrapePro extension installed');
  
  // Set default settings
  chrome.storage.local.set({
    autoExtractVin: true,
    autoPostFacebook: false,
    lazyLoadImages: true,
    scrapingDelay: 2000,
    maxRetries: 3,
    serverUrl: 'https://autoscrappro.replit.dev'
  });
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'START_SCRAPING':
      handleStartScraping(message.data, sendResponse);
      return true; // Keep message channel open for async response
      
    case 'STOP_SCRAPING':
      handleStopScraping(sendResponse);
      return true;
      
    case 'SCRAPE_VEHICLE_DATA':
      handleScrapeVehicleData(message.data, sender, sendResponse);
      return true;
      
    case 'GET_SCRAPING_STATUS':
      sendResponse({ 
        isActive: scrapingSession !== null,
        session: scrapingSession 
      });
      break;
      
    case 'UPDATE_SERVER_URL':
      serverUrl = message.url;
      chrome.storage.local.set({ serverUrl: message.url });
      sendResponse({ success: true });
      break;
      
    default:
      console.log('Unknown message type:', message.type);
  }
});

// Start scraping session
async function handleStartScraping(data, sendResponse) {
  try {
    if (scrapingSession) {
      sendResponse({ success: false, error: 'Scraping session already active' });
      return;
    }

    // Create new scraping session on server
    const response = await fetch(`${serverUrl}/api/scraping/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentSite: data.site,
        totalItems: data.totalItems || 0,
        status: 'active'
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    scrapingSession = await response.json();
    
    // Notify content script to start scraping
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'START_VEHICLE_EXTRACTION',
          sessionId: scrapingSession.id
        });
      }
    });

    sendResponse({ success: true, session: scrapingSession });
  } catch (error) {
    console.error('Failed to start scraping:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Stop scraping session
async function handleStopScraping(sendResponse) {
  try {
    if (!scrapingSession) {
      sendResponse({ success: false, error: 'No active scraping session' });
      return;
    }

    // Update session status on server
    await fetch(`${serverUrl}/api/scraping/${scrapingSession.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'stopped' })
    });

    scrapingSession = null;
    sendResponse({ success: true });
  } catch (error) {
    console.error('Failed to stop scraping:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle vehicle data scraping
async function handleScrapeVehicleData(vehicleData, sender, sendResponse) {
  try {
    // Send vehicle data to server
    const response = await fetch(`${serverUrl}/api/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicleData)
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const savedVehicle = await response.json();
    
    // Update scraping session progress if active
    if (scrapingSession) {
      const progressUpdate = {
        completedItems: (scrapingSession.completedItems || 0) + 1,
        currentAction: `Scraped ${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`
      };

      await fetch(`${serverUrl}/api/scraping/${scrapingSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressUpdate)
      });

      scrapingSession = { ...scrapingSession, ...progressUpdate };
    }

    sendResponse({ success: true, vehicle: savedVehicle });
  } catch (error) {
    console.error('Failed to scrape vehicle data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Auto-post to Facebook if enabled
async function autoPostToFacebook(vehicleData) {
  try {
    const settings = await chrome.storage.local.get(['autoPostFacebook']);
    if (!settings.autoPostFacebook) return;

    const response = await fetch(`${serverUrl}/api/facebook/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId: vehicleData.id })
    });

    if (response.ok) {
      const { description } = await response.json();
      
      // Open Facebook Marketplace with pre-filled data
      chrome.tabs.create({
        url: 'https://www.facebook.com/marketplace/create/vehicle',
        active: false
      });
    }
  } catch (error) {
    console.error('Auto-post to Facebook failed:', error);
  }
}

// Check server connectivity
async function checkServerConnection() {
  try {
    const response = await fetch(`${serverUrl}/api/dashboard/stats`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Periodic server connectivity check
setInterval(async () => {
  const isConnected = await checkServerConnection();
  chrome.storage.local.set({ serverConnected: isConnected });
}, 30000); // Check every 30 seconds
