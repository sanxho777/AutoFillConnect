// AutoScrapePro Popup Script

let scrapingActive = false;
let serverConnected = false;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('AutoScrapePro popup initialized');
  
  // Load current state
  await loadSettings();
  await checkServerConnection();
  await checkScrapingStatus();
  
  // Set up event listeners
  setupEventListeners();
  
  // Start periodic updates
  setInterval(updateStatus, 5000);
});

// Set up event listeners
function setupEventListeners() {
  // Action buttons
  document.getElementById('extract-btn').addEventListener('click', extractCurrentVehicle);
  document.getElementById('start-scraping-btn').addEventListener('click', startBulkScraping);
  document.getElementById('stop-scraping-btn').addEventListener('click', stopScraping);
  document.getElementById('facebook-btn').addEventListener('click', openFacebookMarketplace);
  
  // Settings toggles
  document.getElementById('auto-vin-toggle').addEventListener('click', () => {
    toggleSetting('autoExtractVin', 'auto-vin-toggle');
  });
  
  document.getElementById('auto-facebook-toggle').addEventListener('click', () => {
    toggleSetting('autoPostFacebook', 'auto-facebook-toggle');
  });
  
  document.getElementById('lazy-images-toggle').addEventListener('click', () => {
    toggleSetting('lazyLoadImages', 'lazy-images-toggle');
  });
}

// Load settings from storage
async function loadSettings() {
  const settings = await chrome.storage.local.get([
    'autoExtractVin',
    'autoPostFacebook', 
    'lazyLoadImages'
  ]);
  
  updateToggle('auto-vin-toggle', settings.autoExtractVin !== false);
  updateToggle('auto-facebook-toggle', settings.autoPostFacebook === true);
  updateToggle('lazy-images-toggle', settings.lazyLoadImages !== false);
}

// Check server connection
async function checkServerConnection() {
  try {
    const settings = await chrome.storage.local.get(['serverUrl']);
    const serverUrl = settings.serverUrl || 'https://autoscrappro.replit.dev';
    
    const response = await fetch(`${serverUrl}/api/dashboard/stats`, {
      method: 'GET',
      mode: 'cors'
    });
    
    serverConnected = response.ok;
  } catch (error) {
    console.error('Server connection check failed:', error);
    serverConnected = false;
  }
  
  updateServerStatus();
}

// Check current scraping status
async function checkScrapingStatus() {
  chrome.runtime.sendMessage({ type: 'GET_SCRAPING_STATUS' }, (response) => {
    if (response) {
      scrapingActive = response.isActive;
      updateScrapingUI(response.session);
    }
  });
}

// Update server status UI
function updateServerStatus() {
  const statusElement = document.getElementById('server-status');
  
  if (serverConnected) {
    statusElement.className = 'status connected';
    statusElement.innerHTML = '<div class="status-dot"></div><span>Server Connected</span>';
  } else {
    statusElement.className = 'status disconnected';
    statusElement.innerHTML = '<div class="status-dot"></div><span>Server Disconnected</span>';
  }
  
  // Update button states
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(btn => {
    if (btn.id !== 'facebook-btn') {
      btn.disabled = !serverConnected;
    }
  });
}

// Update scraping UI
function updateScrapingUI(session) {
  const startBtn = document.getElementById('start-scraping-btn');
  const stopBtn = document.getElementById('stop-scraping-btn');
  const progressContainer = document.getElementById('progress-container');
  
  if (scrapingActive && session) {
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    progressContainer.classList.remove('hidden');
    
    // Update progress
    const progress = session.totalItems ? 
      Math.round((session.completedItems / session.totalItems) * 100) : 
      session.progress || 0;
    
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = 
      `${progress}% (${session.completedItems || 0}/${session.totalItems || 0})`;
  } else {
    startBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    progressContainer.classList.add('hidden');
  }
}

// Extract current vehicle data
async function extractCurrentVehicle() {
  if (!serverConnected) {
    showMessage('Server not connected', 'error');
    return;
  }
  
  const extractBtn = document.getElementById('extract-btn');
  const originalText = extractBtn.textContent;
  
  extractBtn.textContent = '⏳ Extracting...';
  extractBtn.disabled = true;
  
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send extraction message to content script
    chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_CURRENT_VEHICLE' }, (response) => {
      if (chrome.runtime.lastError) {
        showMessage('Content script not loaded on this page', 'error');
        return;
      }
      
      if (response && response.success) {
        displayVehicleInfo(response.data);
        showMessage('Vehicle data extracted successfully!', 'success');
      } else {
        showMessage(response?.error || 'Failed to extract vehicle data', 'error');
      }
      
      extractBtn.textContent = originalText;
      extractBtn.disabled = false;
    });
  } catch (error) {
    console.error('Extract vehicle failed:', error);
    showMessage('Failed to extract vehicle data', 'error');
    extractBtn.textContent = originalText;
    extractBtn.disabled = false;
  }
}

// Start bulk scraping
async function startBulkScraping() {
  if (!serverConnected) {
    showMessage('Server not connected', 'error');
    return;
  }
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentSite = new URL(tab.url).hostname;
    
    chrome.runtime.sendMessage({
      type: 'START_SCRAPING',
      data: {
        site: currentSite,
        totalItems: 100 // Default estimate
      }
    }, (response) => {
      if (response && response.success) {
        scrapingActive = true;
        updateScrapingUI(response.session);
        showMessage('Bulk scraping started!', 'success');
      } else {
        showMessage(response?.error || 'Failed to start scraping', 'error');
      }
    });
  } catch (error) {
    console.error('Start scraping failed:', error);
    showMessage('Failed to start scraping', 'error');
  }
}

// Stop scraping
function stopScraping() {
  chrome.runtime.sendMessage({ type: 'STOP_SCRAPING' }, (response) => {
    if (response && response.success) {
      scrapingActive = false;
      updateScrapingUI(null);
      showMessage('Scraping stopped', 'success');
    } else {
      showMessage('Failed to stop scraping', 'error');
    }
  });
}

// Open Facebook Marketplace
function openFacebookMarketplace() {
  chrome.tabs.create({
    url: 'https://www.facebook.com/marketplace/create/vehicle'
  });
}

// Toggle setting
async function toggleSetting(key, toggleId) {
  const currentSettings = await chrome.storage.local.get([key]);
  const newValue = !currentSettings[key];
  
  await chrome.storage.local.set({ [key]: newValue });
  updateToggle(toggleId, newValue);
  
  showMessage(`${key} ${newValue ? 'enabled' : 'disabled'}`, 'success');
}

// Update toggle UI
function updateToggle(toggleId, isActive) {
  const toggle = document.getElementById(toggleId);
  if (isActive) {
    toggle.classList.add('active');
  } else {
    toggle.classList.remove('active');
  }
}

// Display vehicle information
function displayVehicleInfo(vehicleData) {
  const infoContainer = document.getElementById('vehicle-info');
  const titleElement = document.getElementById('vehicle-title');
  const detailsElement = document.getElementById('vehicle-details');
  
  titleElement.textContent = `${vehicleData.year || ''} ${vehicleData.make || ''} ${vehicleData.model || ''}`.trim();
  
  const details = [];
  if (vehicleData.vin) details.push(`VIN: ${vehicleData.vin}`);
  if (vehicleData.price) details.push(`Price: $${vehicleData.price.toLocaleString()}`);
  if (vehicleData.mileage) details.push(`Mileage: ${vehicleData.mileage.toLocaleString()} mi`);
  if (vehicleData.location) details.push(`Location: ${vehicleData.location}`);
  if (vehicleData.source) details.push(`Source: ${vehicleData.source}`);
  
  detailsElement.innerHTML = details.join('<br>');
  infoContainer.classList.remove('hidden');
}

// Show temporary message
function showMessage(message, type) {
  // Create message element
  const messageEl = document.createElement('div');
  messageEl.textContent = message;
  messageEl.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    z-index: 1000;
    ${type === 'success' ? 'background: #4caf50; color: white;' : 'background: #f44336; color: white;'}
  `;
  
  document.body.appendChild(messageEl);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (messageEl.parentNode) {
      messageEl.parentNode.removeChild(messageEl);
    }
  }, 3000);
}

// Update status periodically
async function updateStatus() {
  await checkServerConnection();
  await checkScrapingStatus();
}
