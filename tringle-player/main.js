const video = document.querySelector('video');
const videoContainer = document.getElementById('videoContainer');
const playPauseBtn = document.getElementById('playPauseBtn');
const rewindBtn = document.getElementById('rewindBtn');
const forwardBtn = document.getElementById('forwardBtn');
const muteBtn = document.getElementById('muteBtn');
const volumeSlider = document.getElementById('volumeSlider').querySelector('input');
const currentTimeElem = document.getElementById('currentTime');
const durationElem = document.getElementById('duration');
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
const playOverlay = document.getElementById('playOverlay');
const playButton = document.getElementById('playButton');

let controlsTimeout;
let isMouseOverControls = false;
let initialPlay = true;

// Initialize player immediately when the script loads
document.addEventListener('DOMContentLoaded', initializePlayer);

function initializePlayer() {
    // Set initial volume
    video.volume = volumeSlider.value;
    
    // Show loading until metadata is loaded
    loading.style.display = 'block';
    
    // Show controls initially
    videoContainer.classList.add('controls-visible');
    
    // Show play overlay
    playOverlay.style.display = 'flex';
    
    // Add event listeners
    document.addEventListener('keydown', handleKeyPress);
    
    document.querySelector('.video-controls').addEventListener('mouseenter', () => {
        isMouseOverControls = true;
    });
    
    document.querySelector('.video-controls').addEventListener('mouseleave', () => {
        isMouseOverControls = false;
    });

    // Force metadata load
    if (video.readyState >= 1) {
        handleMetadataLoad();
    } else {
        video.addEventListener('loadedmetadata', handleMetadataLoad);
    }
}

function handleMetadataLoad() {
    durationElem.textContent = formatTime(video.duration);
    loading.style.display = 'none';
    
    // Update time display
    currentTimeElem.textContent = formatTime(video.currentTime);
}

function handleKeyPress(e) {
    switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
            e.preventDefault();
            togglePlay();
            break;
        case 'f':
            e.preventDefault();
            toggleFullscreen();
            break;
        case 'm':
            e.preventDefault();
            toggleMute();
            break;
        case 'arrowleft':
            e.preventDefault();
            video.currentTime = Math.max(0, video.currentTime - 5);
            break;
        case 'arrowright':
            e.preventDefault();
            video.currentTime = Math.min(video.duration, video.currentTime + 5);
            break;
        case 'arrowup':
            e.preventDefault();
            adjustVolume(Math.min(1, video.volume + 0.1));
            break;
        case 'arrowdown':
            e.preventDefault();
            adjustVolume(Math.max(0, video.volume - 0.1));
            break;
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        videoContainer.requestFullscreen().catch(err => {
            console.error('Error attempting to enable fullscreen:', err);
        });
        fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
    } else {
        document.exitFullscreen();
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
    }
}

function toggleMute() {
    video.muted = !video.muted;
    muteBtn.innerHTML = video.muted ? 
        '<i class="fas fa-volume-mute"></i>' : 
        '<i class="fas fa-volume-up"></i>';
}

function adjustVolume(value) {
    video.volume = value;
    volumeSlider.value = value;
    video.muted = value === 0;
    muteBtn.innerHTML = value === 0 ? 
        '<i class="fas fa-volume-mute"></i>' : 
        '<i class="fas fa-volume-up"></i>';
}

function togglePlay() {
    if (video.paused) {
        video.play().catch(error => {
            console.error('Error playing video:', error);
        });
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        if (initialPlay) {
            playOverlay.style.display = 'none';
            initialPlay = false;
        }
    } else {
        video.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
}

function updateProgress() {
    const percentage = (video.currentTime / video.duration) * 100;
    progressBar.style.width = `${percentage}%`;
    currentTimeElem.textContent = formatTime(video.currentTime);
}

function updateBuffer() {
    if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        bufferedBar.style.width = `${(bufferedEnd / duration) * 100}%`;
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function toggleControls(show) {
    clearTimeout(controlsTimeout);
    if (show) {
        videoContainer.classList.add('controls-visible');
        if (!video.paused && !isMouseOverControls) {
            controlsTimeout = setTimeout(() => {
                if (!isMouseOverControls && !settingsMenu.contains(document.activeElement)) {
                    videoContainer.classList.remove('controls-visible');
                }
            }, 3000);
        }
    } else if (!video.paused && !isMouseOverControls) {
        videoContainer.classList.remove('controls-visible');
    }
}

function handleProgressBarInteraction(e) {
    const rect = progressArea.getBoundingClientRect();
    const percentage = Math.min(Math.max(0, (e.clientX - rect.left) / rect.width), 1);
    video.currentTime = percentage * video.duration;
}

function updatePreview(e) {
    const rect = progressArea.getBoundingClientRect();
    const percentage = Math.min(Math.max(0, (e.clientX - rect.left) / rect.width), 1);
    const previewTime = percentage * video.duration;
    
    previewBox.style.display = 'block';
    previewBox.style.left = `${e.clientX - rect.left}px`;
    previewBox.querySelector('.time-stamp').textContent = formatTime(previewTime);
}

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

video.addEventListener('pause', () => {
    videoContainer.classList.add('controls-visible');
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
});

video.addEventListener('play', () => {
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
});

video.addEventListener('timeupdate', updateProgress);
video.addEventListener('progress', updateBuffer);
video.addEventListener('error', () => {
    errorMessage.style.display = 'block';
    loading.style.display = 'none';
});

// Click event listeners
videoContainer.addEventListener('mousemove', () => toggleControls(true));
videoContainer.addEventListener('mouseleave', () => toggleControls(false));
videoContainer.addEventListener('click', (e) => {
    if (e.target === video) {
        togglePlay();
    }
});

playButton.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlay();
});

playPauseBtn.addEventListener('click', togglePlay);
rewindBtn.addEventListener('click', () => video.currentTime -= 5);
forwardBtn.addEventListener('click', () => video.currentTime += 5);
muteBtn.addEventListener('click', toggleMute);

volumeSlider.addEventListener('input', (e) => {
    adjustVolume(parseFloat(e.target.value));
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

settingsBtn.addEventListener('click', () => {
    settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
    showPanel('mainPanel');
});

document.querySelectorAll('.settings-item').forEach(item => {
    item.addEventListener('click', () => {
        const panel = item.getAttribute('data-panel');
        showPanel(panel + 'Panel');
    });
});

document.querySelectorAll('.back-button').forEach(button => {
    button.addEventListener('click', () => {
        showPanel('mainPanel');
    });
});

document.querySelectorAll('.option-item').forEach(option => {
    option.addEventListener('click', () => {
        const panel = option.parentElement.id;
        const value = option.getAttribute(`data-${panel.replace('Panel', '')}`);
        
        option.parentElement.querySelectorAll('.option-item').forEach(opt => {
            opt.classList.remove('active');
        });
        option.classList.add('active');
        
        switch(panel) {
            case 'speedPanel':
                video.playbackRate = parseFloat(value);
                document.getElementById('speedValue').textContent = option.textContent.trim();
                break;
            case 'qualityPanel':
                document.getElementById('qualityValue').textContent = value;
                break;
            case 'loopPanel':
                video.loop = value === 'on';
                document.getElementById('loopValue').textContent = value === 'on' ? 'On' : 'Off';
                break;
        }
        
        settingsMenu.style.display = 'none';
    });
});

fullscreenBtn.addEventListener('click', toggleFullscreen);

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

videoContainer.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.top = `${e.pageY}px`;
});

document.addEventListener('click', () => {
    contextMenu.style.display = 'none';
});