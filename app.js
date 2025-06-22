document.addEventListener('DOMContentLoaded', function() {
    const musicPlayer = document.getElementById('music-player');
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const albumArt = document.getElementById('album-art');
    const songTitle = document.getElementById('song-title');
    const songArtist = document.getElementById('song-artist');
    const progressBar = document.getElementById('progress-bar');
    const progress = document.getElementById('progress');
    const waveProgress = document.getElementById('wave-progress');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');    const audioPlayer = document.getElementById('audio-player');
    const unavailableMessage = document.getElementById('unavailable-message');
    const loopBtn = document.getElementById('loop-btn');    const volumeBtn = document.getElementById('volume-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const searchDropdown = document.getElementById('search-dropdown');
    const dropdownResults = document.getElementById('dropdown-results');    let currentSongIndex = 0;
    let songs = [];
    let isPlaying = false;
    let loopState = 0;
    let hasLoopedOnce = false;
    let isTypingInSearch = false;
    let customSongs = [];
    let currentVolume = 0.5;
    let searchTimeout = null;
    let selectedDropdownIndex = -1;

    function loadCustomSongs() {
        const script = document.createElement('script');
        script.src = 'custom.js';
        script.onload = function() {
            customSongs = window.customSongs || [];
        };
        document.head.appendChild(script);
    }
    loadCustomSongs();

    // Initialize volume
    audioPlayer.volume = currentVolume;
    volumeSlider.value = currentVolume * 100;    searchInput.addEventListener('focus', function() {
        isTypingInSearch = true;
    });

    searchInput.addEventListener('blur', function() {
        isTypingInSearch = false;
        // Hide dropdown after a short delay to allow clicking on results
        setTimeout(() => {
            if (!searchDropdown.contains(document.activeElement)) {
                hideSearchDropdown();
            }
        }, 200);
    });

    // Real-time search as user types
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        selectedDropdownIndex = -1;
        
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        if (query.length < 2) {
            hideSearchDropdown();
            return;
        }
        
        // Debounce search to avoid too many API calls
        searchTimeout = setTimeout(() => {
            performSearch(query, true);
        }, 300);
    });

    // Handle keyboard navigation in dropdown
    searchInput.addEventListener('keydown', function(e) {
        const dropdownItems = searchDropdown.querySelectorAll('.dropdown-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedDropdownIndex = Math.min(selectedDropdownIndex + 1, dropdownItems.length - 1);
            updateDropdownSelection(dropdownItems);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedDropdownIndex = Math.max(selectedDropdownIndex - 1, -1);
            updateDropdownSelection(dropdownItems);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedDropdownIndex >= 0 && dropdownItems[selectedDropdownIndex]) {
                dropdownItems[selectedDropdownIndex].click();
            } else {
                performSearch(this.value.trim(), false);
            }
        } else if (e.key === 'Escape') {
            hideSearchDropdown();
            this.blur();
        }
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchDropdown.contains(e.target) && !searchInput.contains(e.target) && !searchBtn.contains(e.target)) {
            hideSearchDropdown();
        }
    });
    
    themeToggle.addEventListener('click', function() {
        musicPlayer.classList.toggle('dark-mode');
        musicPlayer.classList.toggle('light-mode');
        const icon = themeToggle.querySelector('i');
        if (musicPlayer.classList.contains('light-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });
      searchBtn.addEventListener('click', function() {
        const query = searchInput.value.trim();
        if (query) {
            performSearch(query, false);
        }
    });
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && selectedDropdownIndex === -1) {
            performSearch(this.value.trim(), false);
        }
    });
      loopBtn.addEventListener('click', function() {
        loopState = (loopState + 1) % 3;
        hasLoopedOnce = false;
        updateLoopButton();
    });

    // Volume control event listeners
    volumeBtn.addEventListener('click', function() {
        if (audioPlayer.volume > 0) {
            audioPlayer.volume = 0;
            volumeSlider.value = 0;
            volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            audioPlayer.volume = currentVolume;
            volumeSlider.value = currentVolume * 100;
            updateVolumeIcon();
        }
    });

    volumeSlider.addEventListener('input', function() {
        currentVolume = this.value / 100;
        audioPlayer.volume = currentVolume;
        updateVolumeIcon();
    });

    function updateVolumeIcon() {
        if (audioPlayer.volume === 0) {
            volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else if (audioPlayer.volume < 0.5) {
            volumeBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
        } else {
            volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }
    
    function updateLoopButton() {
        switch(loopState) {
            case 0:
                loopBtn.innerHTML = '<i class="fas fa-repeat"></i>';
                loopBtn.style.color = '';
                break;
            case 1:
                loopBtn.innerHTML = '<i class="fas fa-repeat"></i><span class="loop-count">1</span>';
                loopBtn.style.color = '#007bff';
                break;
            case 2:
                loopBtn.innerHTML = '<i class="fas fa-infinity"></i>';
                loopBtn.style.color = '#007bff';
                break;
        }
    }    async function performSearch(query, isDropdownSearch = false) {
        if (!query) {
            updateUnavailableMessage("Please enter a song name");
            hideSearchDropdown();
            return;
        }
        
        if (isDropdownSearch) {
            showSearchLoading();
        } else {
            updateUnavailableMessage(`Searching for "${query}"...`);
        }
        
        const matchedCustomSongs = customSongs.filter(song => 
            song.name.toLowerCase().includes(query.toLowerCase())
        );
        
        try {
            let allSongs = [...matchedCustomSongs];
            
            // Also search API for more results
            const response = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.data && data.data.results) {
                allSongs = [...allSongs, ...data.data.results];
            }
            
            if (allSongs.length === 0) {
                if (isDropdownSearch) {
                    showNoResults();
                } else {
                    updateUnavailableMessage("No songs found");
                    hideSearchDropdown();
                }
                return;
            }
            
            songs = allSongs;
            
            if (isDropdownSearch) {
                displaySearchDropdown(allSongs.slice(0, 8));
            } else {
                currentSongIndex = 0;
                playSong(songs[currentSongIndex]);
                hideSearchDropdown();
            }
        } catch (error) {
            console.error("Error:", error);
            if (isDropdownSearch) {
                showNoResults();
            } else {
                updateUnavailableMessage("Something went wrong");
                hideSearchDropdown();
            }
        }
    }
    
    function decodeHtmlEntities(text) {
        const textArea = document.createElement('textarea');
        textArea.innerHTML = text;
        return textArea.value;
    }
    
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    function playSong(song) {
        const downloads = song.downloadUrl || [];
        let audioUrl = null;
        
        const qualityPriority = ["320kbps", "160kbps", "96kbps"];
        
        for (const quality of qualityPriority) {
            const cdn = downloads.find(dl => 
                dl.quality === quality && (dl.url.includes("aac.saavncdn.com") || dl.url.startsWith("http"))
            );
            if (cdn) {
                audioUrl = cdn.url;
                break;
            }
        }
          if (audioUrl) {
            audioPlayer.src = audioUrl;
            audioPlayer.volume = currentVolume; // Ensure volume is maintained
            const thumb = song.image?.find(img => img.quality === "500x500")?.url || "";
            
            songTitle.textContent = decodeHtmlEntities(song.name);
            songArtist.textContent = decodeHtmlEntities(song.artists?.primary?.[0]?.name || "Unknown");
            albumArt.src = thumb || 'music.gif';
            
            audioPlayer.play()
                .then(() => {
                    isPlaying = true;
                    updatePlayPauseIcon();
                    updateUnavailableMessage(`Now playing: ${decodeHtmlEntities(song.name)}`);
                })
                .catch(error => {
                    console.error("Playback error:", error);
                    updateUnavailableMessage("Playback error. Check console.");
                });
        } else {
            updateUnavailableMessage("No playable CDN link found");
        }
    }
    
    function updatePlayPauseIcon() {
        if (isPlaying) {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }
    
    function togglePlayPause() {
        if (audioPlayer.src) {
            if (isPlaying) {
                audioPlayer.pause();
            } else {
                audioPlayer.play();
            }
            isPlaying = !isPlaying;
            updatePlayPauseIcon();
        }
    }
    
    playPauseBtn.addEventListener('click', togglePlayPause);
    
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && !isTypingInSearch) {
            e.preventDefault();
            togglePlayPause();
        }
    });
    
    prevBtn.addEventListener('click', function() {
        if (songs.length > 0) {
            currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
            playSong(songs[currentSongIndex]);
        }
    });
    
    nextBtn.addEventListener('click', function() {
        if (songs.length > 0) {
            currentSongIndex = (currentSongIndex + 1) % songs.length;
            playSong(songs[currentSongIndex]);
        }
    });
    
    audioPlayer.addEventListener('timeupdate', function() {
        const currentTime = audioPlayer.currentTime;
        const duration = audioPlayer.duration || 1;
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;
        waveProgress.style.width = `${progressPercent}%`;
        currentTimeDisplay.textContent = formatTime(currentTime);
        if (!isNaN(duration)) {
            durationDisplay.textContent = formatTime(duration);
        }
    });
    
    progressBar.addEventListener('click', function(e) {
        if (audioPlayer.src) {
            const clickPosition = e.offsetX / this.clientWidth;
            audioPlayer.currentTime = clickPosition * audioPlayer.duration;
        }
    });
    
    function updateUnavailableMessage(message) {
        unavailableMessage.innerHTML = `<code>${message}</code>`;
    }
    
    audioPlayer.addEventListener('ended', function() {
        if (loopState === 1) {
            if (!hasLoopedOnce) {
                audioPlayer.currentTime = 0;
                audioPlayer.play();
                hasLoopedOnce = true;
            } else {
                if (songs.length > 0) {
                    currentSongIndex = (currentSongIndex + 1) % songs.length;
                    playSong(songs[currentSongIndex]);
                }
                hasLoopedOnce = false;
            }
        } else if (loopState === 2) {
            audioPlayer.currentTime = 0;
            audioPlayer.play();
        } else {
            if (songs.length > 0) {
                currentSongIndex = (currentSongIndex + 1) % songs.length;
                playSong(songs[currentSongIndex]);
            } else {
                isPlaying = false;
                updatePlayPauseIcon();
            }
        }
    });
    
    audioPlayer.addEventListener('play', function() {
        isPlaying = true;
        updatePlayPauseIcon();
    });
    
    audioPlayer.addEventListener('pause', function() {
        isPlaying = false;
        updatePlayPauseIcon();
    });
      function displaySearchDropdown(songList) {
        dropdownResults.innerHTML = '';
        searchDropdown.classList.remove('hidden');
        
        songList.forEach((song, index) => {
            const dropdownItem = document.createElement('div');
            dropdownItem.className = 'dropdown-item';
            dropdownItem.addEventListener('click', () => {
                const originalIndex = songs.indexOf(song);
                if (originalIndex !== -1) {
                    currentSongIndex = originalIndex;
                    playSong(song);
                    hideSearchDropdown();
                    searchInput.blur();
                }
            });
            
            const thumbnail = song.image?.find(img => img.quality === "150x150")?.url || 
                            song.image?.find(img => img.quality === "500x500")?.url || 
                            'music.gif';
            
            dropdownItem.innerHTML = `
                <img class="dropdown-image" src="${thumbnail}" alt="Album Art" onerror="this.src='music.gif'">
                <div class="dropdown-info">
                    <div class="dropdown-title">${decodeHtmlEntities(song.name)}</div>
                    <div class="dropdown-artist">${decodeHtmlEntities(song.artists?.primary?.[0]?.name || "Unknown Artist")}</div>
                </div>
                <i class="fas fa-play dropdown-play-icon"></i>
            `;
            
            dropdownResults.appendChild(dropdownItem);
        });
    }
    
    function hideSearchDropdown() {
        searchDropdown.classList.add('hidden');
        selectedDropdownIndex = -1;
    }
    
    function showSearchLoading() {
        dropdownResults.innerHTML = '<div class="search-loading"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
        searchDropdown.classList.remove('hidden');
    }
    
    function showNoResults() {
        dropdownResults.innerHTML = '<div class="search-no-results">No songs found</div>';
        searchDropdown.classList.remove('hidden');
    }
    
    function updateDropdownSelection(dropdownItems) {
        dropdownItems.forEach((item, index) => {
            if (index === selectedDropdownIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }
});