

const durationElem = document.getElementById('duration');
const captionsBtn = document.getElementById('captionsBtn');
const pipBtn = document.getElementById('pipBtn');
const settingsBtn = document.getElementById('settingsBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const progressArea = document.getElementById('progressArea');
const progressBar = document.getElementById('progressBar');
const bufferedBar = document.getElementById('bufferedBar');
const previewBox = document.getElementById('previewBox');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const settingsMenu = document.getElementById('settingsMenu');
const contextMenu = document.getElementById('contextMenu');

let controlsTimeout;
let isMouseOverControls = false;
let lastTapTime = 0;

// Initialize video player
// Add these new constants at the top
const playOverlay = document.getElementById('playOverlay');
const playButton = document.getElementById('playButton');

// Initialize video player
function initializePlayer() {
    // Set initial volume
    video.volume = volumeSlider.value;
    
    // Show loading animation
    loading.style.display = 'block';
    
    // Hide controls initially
    videoContainer.classList.remove('controls-visible');
    playOverlay.style.display = 'flex'; // Show the overlay initially
}

// Play/Pause function
function togglePlay() {
    if (video.paused) {
        video.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        playOverlay.style.display = 'none'; // Hide overlay when playing
    } else {
        video.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        playOverlay.style.display = 'flex'; // Show overlay when paused
    }
}

// Event Listener for play button in the overlay
playButton.addEventListener('click', togglePlay);

// Show overlay when video is paused
video.addEventListener('pause', () => {
    playOverlay.style.display = 'flex'; // Show overlay
});

// Hide overlay when video is playing
video.addEventListener('error', () => {
    // Show a custom error overlay
    playOverlay.innerHTML = 'Video not available'; // Custom message
    playOverlay.style.display = 'flex'; // Show the overlay
    playOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // Optional background for error
});

// Hide the overlay if the video plays successfully
video.addEventListener('play', () => {
    playOverlay.style.display = 'none'; // Hide overlay when playing
});


// Your existing event listeners and functions remain here...


// Update progress bar
function updateProgress() {
    const percentage = (video.currentTime / video.duration) * 100;
    progressBar.style.width = `${percentage}%`;
    currentTimeElem.textContent = formatTime(video.currentTime);
}

// Update buffer bar
function updateBuffer() {
    if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        bufferedBar.style.width = `${(bufferedEnd / duration) * 100}%`;
    }
}

// Format time in minutes and seconds
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Show/hide controls
function toggleControls(show) {
    clearTimeout(controlsTimeout);
    if (show) {
        videoContainer.classList.add('controls-visible');
        if (!video.paused) {
            controlsTimeout = setTimeout(() => {
                if (!isMouseOverControls && !settingsMenu.contains(document.activeElement)) {
                    videoContainer.classList.remove('controls-visible');
                }
            }, 3000);
        }
    } else {
        videoContainer.classList.remove('controls-visible');
    }
}

// Handle progress bar click/drag
function handleProgressBarInteraction(e) {
    const rect = progressArea.getBoundingClientRect();
    const percentage = Math.min(Math.max(0, (e.clientX - rect.left) / rect.width), 1);
    video.currentTime = percentage * video.duration;
}

// Preview thumbnail on progress bar hover
function updatePreview(e) {
    const rect = progressArea.getBoundingClientRect();
    const percentage = Math.min(Math.max(0, (e.clientX - rect.left) / rect.width), 1);
    const previewTime = percentage * video.duration;
    
    previewBox.style.display = 'block';
    previewBox.style.left = `${e.clientX - rect.left}px`;
    previewBox.querySelector('.time-stamp').textContent = formatTime(previewTime);
}

// Settings menu handling
let currentPanel = 'mainPanel';

function showPanel(panelId) {
    document.querySelectorAll('.settings-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(panelId).classList.add('active');
    currentPanel = panelId;
}

// Event Listeners
video.addEventListener('loadedmetadata', () => {
    durationElem.textContent = formatTime(video.duration);
    loading.style.display = 'none';
});

video.addEventListener('waiting', () => {
    loading.style.display = 'block';
});

video.addEventListener('playing', () => {
    loading.style.display = 'none';
});

video.addEventListener('timeupdate', updateProgress);
video.addEventListener('progress', updateBuffer);
video.addEventListener('error', () => {
    errorMessage.style.display = 'block';
    loading.style.display = 'none';
});

// Video container events
videoContainer.addEventListener('mousemove', () => toggleControls(true));
videoContainer.addEventListener('mouseleave', () => toggleControls(false));
videoContainer.addEventListener('click', (e) => {
    if (e.target === video) {
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - lastTapTime;
        
        if (timeDiff < 300) {
            togglePlay();
        } else {
            toggleControls(true);
        }
        lastTapTime = currentTime;
    }
});

// Controls events
playPauseBtn.addEventListener('click', togglePlay);
rewindBtn.addEventListener('click', () => video.currentTime -= 5);
forwardBtn.addEventListener('click', () => video.currentTime += 5);
muteBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    muteBtn.innerHTML = video.muted ? 
        '<i class="fas fa-volume-mute"></i>' : 
        '<i class="fas fa-volume-up"></i>';
});

volumeSlider.addEventListener('input', (e) => {
    video.volume = e.target.value;
    video.muted = e.target.value === 0;
});

progressArea.addEventListener('mousedown', (e) => {
    handleProgressBarInteraction(e);
    document.addEventListener('mousemove', handleProgressBarInteraction);
    document.addEventListener('mouseup', () => {
        document.removeEventListener('mousemove', handleProgressBarInteraction);
    }, { once: true });
});

progressArea.addEventListener('mousemove', updatePreview);
progressArea.addEventListener('mouseleave', () => {
    previewBox.style.display = 'none';
});

// Settings button events
settingsBtn.addEventListener('click', () => {
    settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
    showPanel('mainPanel');
});

// Handle settings menu items
document.querySelectorAll('.settings-item').forEach(item => {
    item.addEventListener('click', () => {
        const panel = item.getAttribute('data-panel');
        showPanel(panel + 'Panel');
    });
});

// Handle back buttons
document.querySelectorAll('.back-button').forEach(button => {
    button.addEventListener('click', () => {
        showPanel('mainPanel');
    });
});

// Handle options in settings
document.querySelectorAll('.option-item').forEach(option => {
    option.addEventListener('click', () => {
        const panel = option.parentElement.id;
        const value = option.getAttribute(`data-${panel.replace('Panel', '')}`);
        
        // Update active state
        option.parentElement.querySelectorAll('.option-item').forEach(opt => {
            opt.classList.remove('active');
        });
        option.classList.add('active');
        
        // Apply setting
        switch(panel) {
            case 'speedPanel':
                video.playbackRate = parseFloat(value);
                document.getElementById('speedValue').textContent = option.textContent.trim();
                break;
            case 'qualityPanel':
                document.getElementById('qualityValue').textContent = value;
                // Implement quality change logic here
                break;
            case 'loopPanel':
                video.loop = value === 'on';
                document.getElementById('loopValue').textContent = value === 'on' ? 'On' : 'Off';
                break;
        }
        
        settingsMenu.style.display = 'none';
    });
});

// Fullscreen handling
fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        videoContainer.requestFullscreen();
        fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
    } else {
        document.exitFullscreen();
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
    }
});

// Picture-in-Picture
pipBtn.addEventListener('click', async () => {
    try {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        } else {
            await video.requestPictureInPicture();
        }
    } catch (error) {
        console.error('PiP failed:', error);
    }
});

// Context menu
videoContainer.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.top = `${e.pageY}px`;
});

document.addEventListener('click', () => {
    contextMenu.style.display = 'none';
});

// Initialize player
initializePlayer();

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (!videoContainer.contains(document.activeElement)) return;
    
    switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
            e.preventDefault();
            togglePlay();
            break;
        case 'f':
            fullscreenBtn.click();
            break;
        case 'm':
            muteBtn.click();
            break;
        case 'arrowleft':
            video.currentTime -= 5;
            break;
        case 'arrowright':
            video.currentTime += 5;
            break;
        case 'arrowup':
            video.volume = Math.min(1, video.volume + 0.1);
            volumeSlider.value = video.volume;
            break;
        case 'arrowdown':
            video.volume = Math.max(0, video.volume - 0.1);
            volumeSlider.value = video.volume;
            break;
    }
});
