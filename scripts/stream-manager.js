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
  setupEventListeners(streamButton, streamModal);
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
          Live Camera Stream
        </h2>
        <button id="stream-close" class="btn-close" aria-label="Close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="stream-content">
        <video id="stream-video" 
               autoplay 
               muted 
               playsinline
               controls>
          <p>Your browser doesn't support video streaming.</p>
        </video>
        <div id="stream-controls" class="stream-controls">
          <button id="stream-start" class="btn btn-success">
            <i class="fas fa-play"></i>
            Start Stream
          </button>
          <button id="stream-stop" class="btn btn-danger" style="display: none;">
            <i class="fas fa-stop"></i>
            Stop Stream
          </button>
          <button id="stream-mute" class="btn btn-secondary">
            <i class="fas fa-volume-mute"></i>
            Mute
          </button>
        </div>
      </div>
      <div class="stream-footer">
        <p class="stream-description">
          Live camera feed from your device
        </p>
      </div>
    </div>
  `;
}

/**
 * Set up event listeners
 */
function setupEventListeners(streamButton, streamModal) {
  const closeButton = document.getElementById('stream-close');
  const videoElement = document.getElementById('stream-video');
  const startButton = document.getElementById('stream-start');
  const stopButton = document.getElementById('stream-stop');
  const muteButton = document.getElementById('stream-mute');

  let currentStream = null;
  let isMuted = true;

  // Open stream modal
  streamButton.addEventListener('click', () => {
    console.log('Opening live stream');
    streamModal.hidden = false;
  });

  // Close stream modal
  function closeStreamModal() {
    streamModal.hidden = true;
    stopStream();
  }

  closeButton.addEventListener('click', closeStreamModal);

  // Start stream button
  if (startButton) {
    startButton.addEventListener('click', startStream);
  }

  // Stop stream button
  if (stopButton) {
    stopButton.addEventListener('click', stopStream);
  }

  // Mute/unmute button
  if (muteButton) {
    muteButton.addEventListener('click', toggleMute);
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

  // Handle video events
  if (videoElement) {
    videoElement.addEventListener('loadedmetadata', () => {
      console.log('Video stream loaded');
    });

    videoElement.addEventListener('error', (error) => {
      console.error('Failed to load video stream:', error);
      showStreamError('Failed to access camera. Please check permissions and try again.');
    });
  }

  // Start stream function
  async function startStream() {
    try {
      console.log('Requesting camera access...');
      currentStream = await navigator.mediaDevices.getUserMedia(STREAM_CONFIG.VIDEO_CONSTRAINTS);
      
      if (videoElement) {
        videoElement.srcObject = currentStream;
        videoElement.play();
      }

      // Update button states
      if (startButton) startButton.style.display = 'none';
      if (stopButton) stopButton.style.display = 'inline-block';
      
      console.log('Camera stream started');
    } catch (error) {
      console.error('Failed to start camera stream:', error);
      showStreamError('Camera access denied or not available. Please check permissions.');
    }
  }

  // Stop stream function
  function stopStream() {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }

    if (videoElement) {
      videoElement.srcObject = null;
    }

    // Update button states
    if (startButton) startButton.style.display = 'inline-block';
    if (stopButton) stopButton.style.display = 'none';
    
    console.log('Camera stream stopped');
  }

  // Toggle mute function
  function toggleMute() {
    if (videoElement) {
      videoElement.muted = !videoElement.muted;
      isMuted = videoElement.muted;
      
      // Update button icon
      const icon = muteButton.querySelector('i');
      if (icon) {
        icon.className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
      }
    }
  }
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
