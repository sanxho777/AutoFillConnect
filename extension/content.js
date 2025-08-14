// AutoScrapePro Content Script for Vehicle Data Extraction

// Injection guard to prevent duplicate execution
if (typeof window.autoScrapeProInjected === 'undefined') {
  window.autoScrapeProInjected = true;

  let isExtracting = false;
  let sessionId = null;

  // Site-specific selectors for vehicle data extraction
  const siteConfigs = {
    'autotrader.com': {
      selectors: {
        vin: '[data-cmp="vin"], .vin-number, [data-qaid="cntnr-vin"]',
        year: '[data-cmp="year"], .vehicle-year, .listing-year',
        make: '[data-cmp="make"], .vehicle-make, .listing-make',
        model: '[data-cmp="model"], .vehicle-model, .listing-model',
        trim: '[data-cmp="trim"], .vehicle-trim, .listing-trim',
        price: '[data-cmp="price"], .first-price, .listing-price',
        mileage: '[data-cmp="mileage"], .vehicle-mileage, .listing-mileage',
        location: '[data-cmp="location"], .dealer-address, .listing-location',
        description: '[data-cmp="description"], .vehicle-description, .listing-description',
        images: '.media-viewer-thumbnail img, .carousel-inner img, .vehicle-image img',
        features: '.vehicle-features li, .equipment-list li, .features-list li'
      }
    },
    'cars.com': {
      selectors: {
        vin: '.vin-display, [data-linkname="vin"], .vehicle-vin',
        year: '.vehicle-year, .listing-year, [data-linkname="year"]',
        make: '.vehicle-make, .listing-make, [data-linkname="make"]',
        model: '.vehicle-model, .listing-model, [data-linkname="model"]',
        trim: '.vehicle-trim, .listing-trim, [data-linkname="trim"]',
        price: '.primary-price, .vehicle-price, [data-linkname="price"]',
        mileage: '.vehicle-mileage, .listing-mileage, [data-linkname="mileage"]',
        location: '.dealer-address, .listing-location, [data-linkname="dealer-address"]',
        description: '.vehicle-description, .listing-description',
        images: '.media-gallery img, .vehicle-photos img, .carousel img',
        features: '.vehicle-features li, .features-section li'
      }
    },
    'cargurus.com': {
      selectors: {
        vin: '.vin-number, [data-cg-ft="vin"], .vehicle-vin',
        year: '.vehicle-year, [data-cg-ft="year"], .listing-year',
        make: '.vehicle-make, [data-cg-ft="make"], .listing-make',
        model: '.vehicle-model, [data-cg-ft="model"], .listing-model',
        trim: '.vehicle-trim, [data-cg-ft="trim"], .listing-trim',
        price: '.price-section, [data-cg-ft="price"], .vehicle-price',
        mileage: '.vehicle-mileage, [data-cg-ft="mileage"], .listing-mileage',
        location: '.dealer-distance, [data-cg-ft="dealer"], .listing-location',
        description: '.listing-description, .vehicle-description',
        images: '.media-viewer img, .listing-photos img, .vehicle-images img',
        features: '.vehicle-features li, .listing-features li'
      }
    },
    'dealer.com': {
      selectors: {
        vin: '.vehicle-vin, .vin-display, [data-field="vin"]',
        year: '.vehicle-year, .year-display, [data-field="year"]',
        make: '.vehicle-make, .make-display, [data-field="make"]',
        model: '.vehicle-model, .model-display, [data-field="model"]',
        trim: '.vehicle-trim, .trim-display, [data-field="trim"]',
        price: '.vehicle-price, .price-display, [data-field="price"]',
        mileage: '.vehicle-mileage, .mileage-display, [data-field="mileage"]',
        location: '.dealer-location, .location-display, [data-field="location"]',
        description: '.vehicle-description, .description-display',
        images: '.vehicle-gallery img, .photo-gallery img, .vehicle-photos img',
        features: '.vehicle-features li, .equipment-list li'
      }
    }
  };

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'START_VEHICLE_EXTRACTION':
        sessionId = message.sessionId;
        startVehicleExtraction(sendResponse);
        return true;
        
      case 'EXTRACT_CURRENT_VEHICLE':
        extractCurrentVehicle(sendResponse);
        return true;
        
      case 'STOP_EXTRACTION':
        stopExtraction(sendResponse);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  });

  // Start vehicle extraction process
  async function startVehicleExtraction(sendResponse) {
    if (isExtracting) {
      sendResponse({ success: false, error: 'Extraction already in progress' });
      return;
    }

    isExtracting = true;
    
    try {
      // Wait for page to fully load
      await waitForPageLoad();
      
      // Extract current vehicle data
      const vehicleData = await extractCurrentVehicle();
      
      if (vehicleData) {
        // Send data to background script
        chrome.runtime.sendMessage({
          type: 'SCRAPE_VEHICLE_DATA',
          data: vehicleData
        }, (response) => {
          if (response.success) {
            console.log('Vehicle data saved:', response.vehicle);
            sendResponse({ success: true, vehicle: response.vehicle });
          } else {
            console.error('Failed to save vehicle data:', response.error);
            sendResponse({ success: false, error: response.error });
          }
        });
      } else {
        sendResponse({ success: false, error: 'No vehicle data found on current page' });
      }
    } catch (error) {
      console.error('Vehicle extraction failed:', error);
      sendResponse({ success: false, error: error.message });
    } finally {
      isExtracting = false;
    }
  }

  // Extract vehicle data from current page
  async function extractCurrentVehicle(sendResponse) {
    const currentSite = getCurrentSite();
    const config = siteConfigs[currentSite];
    
    if (!config) {
      const error = `Unsupported site: ${currentSite}`;
      console.error(error);
      if (sendResponse) sendResponse({ success: false, error });
      return null;
    }

    try {
      // Wait for lazy-loaded content
      await waitForImages();
      
      const vehicleData = {
        source: currentSite,
        sourceUrl: window.location.href,
        vin: extractText(config.selectors.vin, vinValidator),
        year: extractYear(config.selectors.year),
        make: extractText(config.selectors.make),
        model: extractText(config.selectors.model),
        trim: extractText(config.selectors.trim),
        price: extractPrice(config.selectors.price),
        mileage: extractMileage(config.selectors.mileage),
        location: extractText(config.selectors.location),
        description: extractText(config.selectors.description),
        images: extractImages(config.selectors.images),
        features: extractFeatures(config.selectors.features)
      };

      // Validate extracted data
      if (!vehicleData.make || !vehicleData.model) {
        throw new Error('Failed to extract essential vehicle data (make/model)');
      }

      console.log('Extracted vehicle data:', vehicleData);
      
      if (sendResponse) {
        sendResponse({ success: true, data: vehicleData });
      }
      
      return vehicleData;
    } catch (error) {
      console.error('Failed to extract vehicle data:', error);
      if (sendResponse) {
        sendResponse({ success: false, error: error.message });
      }
      return null;
    }
  }

  // Stop extraction process
  function stopExtraction(sendResponse) {
    isExtracting = false;
    sessionId = null;
    sendResponse({ success: true });
  }

  // Utility functions
  function getCurrentSite() {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('autotrader')) return 'autotrader.com';
    if (hostname.includes('cars.com')) return 'cars.com';
    if (hostname.includes('cargurus')) return 'cargurus.com';
    if (hostname.includes('dealer')) return 'dealer.com';
    return hostname;
  }

  function extractText(selector, validator = null) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = element.textContent?.trim();
      if (text && (!validator || validator(text))) {
        return text;
      }
    }
    return null;
  }

  function extractYear(selector) {
    const text = extractText(selector);
    if (!text) return null;
    
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? parseInt(yearMatch[0]) : null;
  }

  function extractPrice(selector) {
    const text = extractText(selector);
    if (!text) return null;
    
    const priceMatch = text.match(/\$?[\d,]+/);
    if (priceMatch) {
      const price = priceMatch[0].replace(/[$,]/g, '');
      return parseFloat(price);
    }
    return null;
  }

  function extractMileage(selector) {
    const text = extractText(selector);
    if (!text) return null;
    
    const mileageMatch = text.match(/([\d,]+)\s*(mi|miles|km)/i);
    if (mileageMatch) {
      const mileage = mileageMatch[1].replace(/,/g, '');
      return parseInt(mileage);
    }
    return null;
  }

  function extractImages(selector) {
    const images = [];
    const imgElements = document.querySelectorAll(selector);
    
    imgElements.forEach(img => {
      const src = img.src || img.dataset.src || img.dataset.original;
      if (src && src.startsWith('http') && !src.includes('placeholder')) {
        images.push(src);
      }
    });
    
    // Remove duplicates and limit to 10 images
    return [...new Set(images)].slice(0, 10);
  }

  function extractFeatures(selector) {
    const features = [];
    const featureElements = document.querySelectorAll(selector);
    
    featureElements.forEach(element => {
      const text = element.textContent?.trim();
      if (text && text.length > 2 && text.length < 100) {
        features.push(text);
      }
    });
    
    return [...new Set(features)];
  }

  // Validators
  function vinValidator(text) {
    // VIN should be 17 characters, alphanumeric, excluding I, O, Q
    const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/i;
    return vinPattern.test(text.replace(/\s/g, ''));
  }

  // Wait for page to load
  function waitForPageLoad() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve, { once: true });
      }
    });
  }

  // Wait for lazy-loaded images
  function waitForImages(timeout = 5000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      function checkImages() {
        const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]');
        const hasLazyImages = lazyImages.length > 0;
        const isTimedOut = Date.now() - startTime > timeout;
        
        if (!hasLazyImages || isTimedOut) {
          resolve();
        } else {
          setTimeout(checkImages, 500);
        }
      }
      
      checkImages();
    });
  }

  // Auto-extraction on page load for supported sites
  window.addEventListener('load', () => {
    const currentSite = getCurrentSite();
    if (siteConfigs[currentSite]) {
      console.log('AutoScrapePro content script loaded on:', currentSite);
      
      // Check if auto-extraction is enabled
      chrome.storage.local.get(['autoExtractVin'], (result) => {
        if (result.autoExtractVin) {
          setTimeout(() => {
            if (!isExtracting) {
              extractCurrentVehicle();
            }
          }, 2000); // Wait 2 seconds for page to stabilize
        }
      });
    }
  });

  console.log('AutoScrapePro content script initialized');
}
