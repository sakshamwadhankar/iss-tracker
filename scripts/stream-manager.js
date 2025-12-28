/**
 * Stream Manager - Live video stream functionality
 * Handles live camera stream modal and controls
 */

// Configuration
const STREAM_CONFIG = {
  VIDEO_CONSTRAINTS: {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    },
    audio: false
  },
  AUTOPLAY: true,
  MUTE_ON_OPEN: true,
  MUTE_ON_CLOSE: true
};

/**
 * Initialize live stream functionality
 */
function initializeStreamManager() {
  const streamButton = document.getElementById('live-stream');
  const streamModal = document.getElementById('live-stream-modal');

  if (!streamButton || !streamModal) {
    console.error('Stream elements not found');
    return;
  }

  setupStreamModal(streamModal);
  setupStreamEventListeners(streamButton, streamModal);
}

/**
 * Set up the stream modal interface
 */
function setupStreamModal(modal) {
  modal.innerHTML = `
    <div class="stream-container">
      <div class="stream-header">
        <h2>
          <i class="fas fa-video"></i>
          Live ISS Feeds
        </h2>
        <button id="stream-close" class="btn-close" aria-label="Close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="stream-content youtube-grid">
        <div class="video-wrapper">
          <h3><i class="fas fa-globe-americas"></i> Outer View (EHDC)</h3>
          <iframe 
            src="https://www.youtube.com/embed/Hj1XwNjvkDE?autoplay=1&mute=1&controls=1&loop=1&playlist=Hj1XwNjvkDE&rel=0" 
            title="ISS Outer View" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </div>
        <div class="video-wrapper">
          <h3><i class="fas fa-window-maximize"></i> Inner View</h3>
          <iframe 
            src="https://www.youtube.com/embed/iYmvCUonukw?autoplay=1&mute=1&controls=1&loop=1&playlist=iYmvCUonukw&rel=0" 
            title="ISS Inner View" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </div>
      </div>
      <div class="stream-footer">
        <p class="stream-description">
          Official live streams from the International Space Station
        </p>
      </div>
    </div>
  `;
}

/**
 * Set up event listeners
 */
function setupStreamEventListeners(streamButton, streamModal) {
  const closeButton = document.getElementById('stream-close');

  // Open stream modal
  streamButton.addEventListener('click', () => {
    console.log('Opening live stream');
    streamModal.hidden = false;
  });

  // Close stream modal logic
  function closeStreamModal() {
    streamModal.hidden = true;
    // Stop videos by resetting src (stops audio/buffering)
    const iframes = streamModal.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      const src = iframe.src;
      iframe.src = src;
    });
  }

  // Bind close events
  if (closeButton) {
    closeButton.addEventListener('click', closeStreamModal);
  }

  // Close on ESC key
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !streamModal.hidden) {
      closeStreamModal();
    }
  });

  // Close on backdrop click
  streamModal.addEventListener('click', (event) => {
    if (event.target === streamModal) {
      closeStreamModal();
    }
  });
}

/**
 * Get current stream status
 */
function getStreamStatus() {
  const streamModal = document.getElementById('live-stream-modal');
  const videoElement = document.getElementById('stream-video');

  return {
    isOpen: !streamModal.hidden,
    isStreaming: videoElement && videoElement.srcObject !== null,
    isMuted: videoElement ? videoElement.muted : true
  };
}

/**
 * Show stream error message
 */
function showStreamError(message) {
  const streamContent = document.querySelector('.stream-content');
  if (streamContent) {
    streamContent.innerHTML = `
      <div class="stream-error">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="error-message">
          <h3>Stream Unavailable</h3>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="location.reload()">
            <i class="fas fa-refresh"></i>
            Retry
          </button>
        </div>
      </div>
    `;
  }
}

/**
 * Get stream controls
 */
function getStreamControls() {
  return {
    start: () => {
      const startButton = document.getElementById('stream-start');
      if (startButton) startButton.click();
    },
    stop: () => {
      const stopButton = document.getElementById('stream-stop');
      if (stopButton) stopButton.click();
    },
    toggleMute: () => {
      const muteButton = document.getElementById('stream-mute');
      if (muteButton) muteButton.click();
    }
  };
}

/**
 * Stream quality settings
 */
const STREAM_QUALITY = {
  HIGH: { width: 1920, height: 1080, frameRate: 30 },
  MEDIUM: { width: 1280, height: 720, frameRate: 30 },
  LOW: { width: 640, height: 480, frameRate: 15 }
};

/**
 * Set stream quality
 */
function setStreamQuality(quality) {
  // This would require restarting the stream with new constraints
  console.log('Quality change requested:', quality);
  // Implementation would need to stop current stream and restart with new constraints
}

/**
 * Stream keyboard shortcuts
 */
function setupStreamKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    const streamModal = document.getElementById('live-stream-modal');
    if (!streamModal.hidden) {
      switch (event.key) {
        case ' ':
          event.preventDefault();
          const muteButton = document.getElementById('stream-mute');
          if (muteButton) muteButton.click();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          const muteBtn = document.getElementById('stream-mute');
          if (muteBtn) muteBtn.click();
          break;
        case 's':
        case 'S':
          const startButton = document.getElementById('stream-start');
          const stopButton = document.getElementById('stream-stop');
          if (startButton && startButton.style.display !== 'none') {
            startButton.click();
          } else if (stopButton && stopButton.style.display !== 'none') {
            stopButton.click();
          }
          break;
      }
    }
  });
}

/**
 * Toggle fullscreen mode
 */
function toggleFullscreen() {
  const streamContainer = document.querySelector('.stream-container');
  if (streamContainer) {
    if (!document.fullscreenElement) {
      streamContainer.requestFullscreen().catch(err => {
        console.warn('Failed to enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.warn('Failed to exit fullscreen:', err);
      });
    }
  }
}

/**
 * Stream analytics
 */
function trackStreamEvent(event, data = {}) {
  console.log('Stream event:', event, data);
  // In a real application, you would send this to analytics
}

/**
 * Initialize stream analytics
 */
function initializeStreamAnalytics() {
  const streamButton = document.getElementById('live-stream');
  const streamModal = document.getElementById('live-stream-modal');

  if (streamButton) {
    streamButton.addEventListener('click', () => {
      trackStreamEvent('stream_opened');
    });
  }

  if (streamModal) {
    const closeButton = document.getElementById('stream-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        trackStreamEvent('stream_closed');
      });
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeStreamManager();
    setupStreamKeyboardShortcuts();
    initializeStreamAnalytics();
  });
} else {
  initializeStreamManager();
  setupStreamKeyboardShortcuts();
  initializeStreamAnalytics();
}

// Export for external use
window.StreamManager = {
  getStatus: getStreamStatus,
  getControls: getStreamControls,
  setQuality: setStreamQuality,
  toggleFullscreen: toggleFullscreen
};
